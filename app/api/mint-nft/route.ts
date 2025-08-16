import { NextRequest, NextResponse } from 'next/server'
import { MintNFTRequest, MintNFTResponse } from '@/types'
import { generateNFTMetadata, uploadToIPFS, uploadMetadataToIPFS, validateGameResultForNFT } from '@/lib/nft-utils'
import { ethers } from 'ethers'
import NFTContract from '@/lib/contracts/FriendsweeperNFT.json'

export async function POST(request: NextRequest): Promise<NextResponse<MintNFTResponse>> {
  console.log('NFT minting request received')
  
  try {
    // Check environment variables first
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL

    console.log('Environment variables check:', {
      contractAddress: contractAddress ? 'Set' : 'Missing',
      ownerPrivateKey: ownerPrivateKey ? 'Set' : 'Missing',
      rpcUrl: rpcUrl ? 'Set' : 'Missing'
    })

    if (!contractAddress) {
      console.error('NFT_CONTRACT_ADDRESS not configured')
      return NextResponse.json(
        { success: false, error: 'NFT contract address not configured' },
        { status: 500 }
      )
    }

    if (!ownerPrivateKey) {
      console.error('CONTRACT_OWNER_PRIVATE_KEY not configured')
      return NextResponse.json(
        { success: false, error: 'Contract owner private key not configured' },
        { status: 500 }
      )
    }

    if (!rpcUrl) {
      console.error('BASE_SEPOLIA_RPC_URL not configured')
      return NextResponse.json(
        { success: false, error: 'Base Sepolia RPC URL not configured' },
        { status: 500 }
      )
    }

    const { gameResult, userFid, userAddress }: MintNFTRequest = await request.json()
    console.log('Request data parsed:', { userAddress, userFid, hasBoardImage: !!gameResult.boardImage })

    if (!gameResult || !userAddress) {
      console.error('Missing required data:', { gameResult: !!gameResult, userAddress: !!userAddress })
      return NextResponse.json(
        { success: false, error: 'Missing required data' },
        { status: 400 }
      )
    }

    // Validate game result
    console.log('Validating game result...')
    const validation = validateGameResultForNFT(gameResult)
    if (!validation.isValid) {
      console.error('Game result validation failed:', validation.error)
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }
    console.log('Game result validation passed')

    // Upload board image to Cloudflare
    console.log('Starting board image upload...')
    const imageUrl = await uploadToIPFS(gameResult.boardImage!, 'image/png')
    console.log('Board image uploaded to Cloudflare:', imageUrl)

    // Generate NFT metadata
    const metadata = generateNFTMetadata(gameResult, imageUrl)
    console.log('NFT metadata generated:', metadata)

    // Upload metadata to Cloudflare
    const metadataUrl = await uploadMetadataToIPFS(metadata)
    console.log('Metadata uploaded to Cloudflare:', metadataUrl)

    // Environment variables already checked above

    try {
      console.log('Setting up blockchain connection...')
      // Setup provider and signer
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      const signer = new ethers.Wallet(ownerPrivateKey, provider)
      console.log('Provider and signer created')

      // Create contract instance
      console.log('Creating contract instance...')
      const contract = new ethers.Contract(
        contractAddress,
        NFTContract.abi,
        signer
      )
      console.log('Contract instance created')

      // Estimate gas for minting (ERC-1155 requires amount parameter)
      console.log('Estimating gas for minting...')
      const gasEstimate = await contract.mint.estimateGas(userAddress, metadataUrl, 1)
      console.log('Estimated gas for minting:', gasEstimate.toString())

      // Mint the NFT (amount = 1 for unique NFTs)
      const tx = await contract.mint(userAddress, metadataUrl, 1, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100) // Add 20% buffer
      })

      console.log('NFT minting transaction sent:', tx.hash)

      // Wait for transaction confirmation
      const receipt = await tx.wait(1) // Wait for 1 confirmation

      if (receipt.status === 1) {
        // Get the token ID from the event
        const mintEvent = receipt.logs.find((log: any) => 
          log.topics[0] === ethers.id('NFTMinted(address,uint256,string)')
        )

        let tokenId = '0'
        if (mintEvent) {
          try {
            const decodedLog = contract.interface.parseLog(mintEvent)
            if (decodedLog) {
              tokenId = decodedLog.args[1].toString() // tokenId is the second argument
            }
          } catch (error) {
            console.log('Could not decode mint event, using default token ID')
          }
        }

        const response: MintNFTResponse = {
          success: true,
          tokenId: tokenId,
          transactionHash: tx.hash,
        }

        return NextResponse.json(response)
      } else {
        return NextResponse.json(
          { success: false, error: 'Transaction failed' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Error minting NFT:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Contract minting failed'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error minting NFT:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
