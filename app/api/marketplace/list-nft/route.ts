import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import NFTContract from '@/lib/contracts/FriendsweeperNFT.json'

interface ListNFTRequest {
  tokenId: string
  price: string // Price in wei
  userAddress: string
}

interface ListNFTResponse {
  success: boolean
  transactionHash?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ListNFTResponse>> {
  try {
    const { tokenId, price, userAddress }: ListNFTRequest = await request.json()

    if (!tokenId || !price || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required data' },
        { status: 400 }
      )
    }

    // Get contract address from environment
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'NFT contract address not configured' },
        { status: 500 }
      )
    }

    try {
      // Setup provider and signer
      const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      const signer = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY!, provider)

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        NFTContract.abi,
        signer
      )

      // Estimate gas for listing
      const gasEstimate = await contract.listNFT.estimateGas(tokenId, price)
      console.log('Estimated gas for listing:', gasEstimate.toString())

      // List the NFT
      const tx = await contract.listNFT(tokenId, price, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100) // Add 20% buffer
      })

      console.log('NFT listing transaction sent:', tx.hash)

      // Wait for transaction confirmation
      const receipt = await tx.wait(1) // Wait for 1 confirmation

      if (receipt.status === 1) {
        const response: ListNFTResponse = {
          success: true,
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
      console.error('Error listing NFT:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Contract listing failed'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error listing NFT:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
