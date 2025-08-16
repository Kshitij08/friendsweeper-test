import { NextRequest, NextResponse } from 'next/server'
import { MintNFTRequest } from '@/types'

export async function POST(request: NextRequest) {
  console.log('=== DEBUG MINT START ===')
  
  try {
    // Step 1: Check environment variables
    console.log('Step 1: Checking environment variables...')
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL

    console.log('Environment check:', {
      contractAddress: contractAddress ? 'Set' : 'Missing',
      ownerPrivateKey: ownerPrivateKey ? 'Set' : 'Missing',
      rpcUrl: rpcUrl ? 'Set' : 'Missing',
      cloudflareWorkerUrl: cloudflareWorkerUrl ? 'Set' : 'Missing'
    })

    // Step 2: Parse request body
    console.log('Step 2: Parsing request body...')
    const body = await request.json()
    console.log('Request body received:', { 
      hasBody: !!body,
      hasGameResult: !!body.gameResult,
      hasUserAddress: !!body.userAddress,
      hasBoardImage: !!body.gameResult?.boardImage
    })

    // Step 3: Test imports
    console.log('Step 3: Testing imports...')
    try {
      const { ethers } = await import('ethers')
      console.log('✅ Ethers import successful')
    } catch (error) {
      console.error('❌ Ethers import failed:', error)
      throw error
    }

    try {
      const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
      console.log('✅ NFT Contract import successful')
    } catch (error) {
      console.error('❌ NFT Contract import failed:', error)
      throw error
    }

    try {
      const { generateNFTMetadata, uploadToIPFS, uploadMetadataToIPFS, validateGameResultForNFT } = await import('@/lib/nft-utils')
      console.log('✅ NFT Utils import successful')
    } catch (error) {
      console.error('❌ NFT Utils import failed:', error)
      throw error
    }

    // Step 4: Test validation
    console.log('Step 4: Testing game result validation...')
    try {
      const { validateGameResultForNFT } = await import('@/lib/nft-utils')
      const validation = validateGameResultForNFT(body.gameResult)
      console.log('✅ Game result validation:', validation)
    } catch (error) {
      console.error('❌ Game result validation failed:', error)
      throw error
    }

    // Step 5: Test Cloudflare upload
    console.log('Step 5: Testing Cloudflare upload...')
    try {
      const { uploadToIPFS } = await import('@/lib/nft-utils')
      const imageUrl = await uploadToIPFS(body.gameResult.boardImage, 'image/png')
      console.log('✅ Image upload successful:', imageUrl)
    } catch (error) {
      console.error('❌ Image upload failed:', error)
      throw error
    }

    // Step 6: Test metadata generation and upload
    console.log('Step 6: Testing metadata generation and upload...')
    try {
      const { generateNFTMetadata, uploadMetadataToIPFS } = await import('@/lib/nft-utils')
      const metadata = generateNFTMetadata(body.gameResult, 'https://example.com/image.png')
      console.log('✅ Metadata generation successful')
      
      const metadataUrl = await uploadMetadataToIPFS(metadata)
      console.log('✅ Metadata upload successful:', metadataUrl)
    } catch (error) {
      console.error('❌ Metadata generation/upload failed:', error)
      throw error
    }

    // Step 7: Test blockchain connection
    console.log('Step 7: Testing blockchain connection...')
    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.JsonRpcProvider(rpcUrl!)
      const signer = new ethers.Wallet(ownerPrivateKey!, provider)
      console.log('✅ Provider and signer created')
      
      const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
      const contract = new ethers.Contract(contractAddress!, NFTContract.default.abi, signer)
      console.log('✅ Contract instance created')
    } catch (error) {
      console.error('❌ Blockchain connection failed:', error)
      throw error
    }

    console.log('=== DEBUG MINT SUCCESS ===')
    return NextResponse.json({
      success: true,
      message: 'All debug steps passed successfully',
      steps: [
        'Environment variables checked',
        'Request body parsed',
        'Imports tested',
        'Game result validated',
        'Image upload tested',
        'Metadata generation/upload tested',
        'Blockchain connection tested'
      ]
    })

  } catch (error) {
    console.error('=== DEBUG MINT FAILED ===')
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
