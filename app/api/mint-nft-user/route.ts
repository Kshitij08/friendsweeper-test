import { NextRequest, NextResponse } from 'next/server'
import { MintNFTRequest } from '@/types'

export async function POST(request: NextRequest) {
  console.log('=== USER-PAYS-GAS NFT MINTING START ===')
  
  try {
    // Check environment variables
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL

    if (!contractAddress || !rpcUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required environment variables' },
        { status: 500 }
      )
    }

    // Parse request
    const body: MintNFTRequest = await request.json()
    console.log('Request received:', { 
      hasGameResult: !!body.gameResult,
      hasUserAddress: !!body.userAddress,
      userAddress: body.userAddress,
      hasBoardImage: !!body.gameResult?.boardImage
    })

    // Validate user address
    if (!body.userAddress || body.userAddress === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { success: false, error: 'Invalid user address' },
        { status: 400 }
      )
    }

    // Step 1: Upload image to Cloudflare (this works)
    console.log('Step 1: Uploading image to Cloudflare...')
    let imageUrl = ''
    try {
      const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL
      if (cloudflareWorkerUrl && body.gameResult.boardImage) {
        const imageResponse = await fetch(`${cloudflareWorkerUrl}/upload/board-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: body.gameResult.boardImage,
            gameResult: body.gameResult
          })
        })
        
        if (imageResponse.ok) {
          const imageResult = await imageResponse.json()
          imageUrl = imageResult.publicUrl
          console.log('✅ Image uploaded successfully:', imageUrl)
        } else {
          console.warn('⚠️ Image upload failed, using fallback')
        }
      }
    } catch (imageError) {
      console.warn('⚠️ Image upload failed:', imageError)
    }

    // Step 2: Generate metadata
    console.log('Step 2: Generating metadata...')
    const metadata = {
      name: `Friendsweeper ${body.gameResult.gameWon ? 'Victory' : 'Game Over'} #${Date.now()}`,
      description: body.gameResult.gameWon 
        ? `A victorious Friendsweeper game where the player avoided all ${body.gameResult.followers.length} followers and won!`
        : `A Friendsweeper game where the player was defeated by a follower.`,
      image: imageUrl || 'https://example.com/fallback-image.png',
      external_url: 'https://friendsweeper-test.vercel.app',
      attributes: [
        { trait_type: "Result", value: body.gameResult.gameWon ? "Victory" : "Defeat" },
        { trait_type: "Followers Count", value: body.gameResult.followers.length },
        { trait_type: "Game Type", value: "Friendsweeper" },
        { trait_type: "Board Size", value: `${body.gameResult.grid.length}x${body.gameResult.grid[0]?.length || 0}` },
        { trait_type: "Date", value: new Date().toISOString().split('T')[0] }
      ]
    }

    // Add killed by follower if game was lost
    if (!body.gameResult.gameWon && body.gameResult.killedBy) {
      metadata.attributes.push({
        trait_type: "Killed By",
        value: body.gameResult.killedBy.username || body.gameResult.killedBy.displayName || "Unknown"
      })
    }

    console.log('✅ Metadata generated:', metadata)

    // Step 3: Prepare transaction data for user to sign
    console.log('Step 3: Preparing transaction data...')
    const { ethers } = await import('ethers')
    
    // Create provider (read-only)
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // Import contract ABI
    const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
    
    // Create contract instance (read-only)
    const contract = new ethers.Contract(contractAddress, NFTContract.default.abi, provider)

    // Create metadata URI
    const metadataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`
    
    // Encode the mint function call
    const mintData = contract.interface.encodeFunctionData('mint', [
      body.userAddress, // to address
      metadataUri, // metadata URI
      BigInt(1) // amount
    ])

    // Get current gas price
    const gasPrice = await provider.getFeeData()
    
    // Estimate gas for the transaction
    const gasEstimate = await contract.mint.estimateGas(
      body.userAddress,
      metadataUri,
      BigInt(1)
    )

    console.log('=== USER-PAYS-GAS NFT MINTING PREPARED ===')
    return NextResponse.json({
      success: true,
      transactionData: {
        to: contractAddress,
        data: mintData,
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice?.toString() || '0',
        maxFeePerGas: gasPrice.maxFeePerGas?.toString() || '0',
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString() || '0'
      },
      metadata: metadata,
      imageUrl: imageUrl,
      message: 'Transaction data prepared. User needs to sign and send this transaction.'
    })

  } catch (error) {
    console.error('=== USER-PAYS-GAS NFT MINTING FAILED ===')
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
