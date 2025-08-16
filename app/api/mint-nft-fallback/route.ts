import { NextRequest, NextResponse } from 'next/server'
import { MintNFTRequest, MintNFTResponse } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse<MintNFTResponse>> {
  console.log('=== FALLBACK NFT MINTING START ===')
  
  try {
    // Check environment variables
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL

    if (!contractAddress || !ownerPrivateKey || !rpcUrl) {
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
      hasBoardImage: !!body.gameResult?.boardImage
    })

    // Step 1: Upload image to Cloudflare (this works)
    console.log('Step 1: Uploading image to Cloudflare...')
    const { ethers } = await import('ethers')
    
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

    // Step 2: Generate metadata (without uploading to Cloudflare)
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

    // Step 3: Mint NFT on blockchain
    console.log('Step 3: Minting NFT on blockchain...')
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(ownerPrivateKey, provider)
    
    const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
    const contract = new ethers.Contract(contractAddress, NFTContract.default.abi, signer)

    // Use a simple metadata URI for now (we'll store the metadata on-chain later)
    const metadataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`
    
    console.log('Minting NFT with metadata URI...')
    const mintTx = await contract.mint(
      body.userAddress,
      BigInt(1), // amount - convert to BigInt
      metadataUri,
      { gasLimit: 500000 }
    )

    console.log('Transaction sent:', mintTx.hash)
    const receipt = await mintTx.wait()
    console.log('Transaction confirmed:', receipt.hash)

    // Extract token ID from logs
    let tokenId = null
    for (const log of receipt.logs) {
      try {
        const decodedLog = contract.interface.parseLog(log)
        if (decodedLog && decodedLog.name === 'TransferSingle') {
          tokenId = decodedLog.args.id.toString()
          break
        }
      } catch (e) {
        // Continue to next log
      }
    }

    console.log('=== FALLBACK NFT MINTING SUCCESS ===')
    return NextResponse.json({
      success: true,
      tokenId: tokenId || 'unknown',
      transactionHash: receipt.hash,
      metadata: metadata,
      imageUrl: imageUrl
    })

  } catch (error) {
    console.error('=== FALLBACK NFT MINTING FAILED ===')
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
