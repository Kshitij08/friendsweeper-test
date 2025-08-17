import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING BASIC CONTRACT FUNCTIONALITY ===')
    
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL

    if (!contractAddress || !rpcUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        env: {
          contractAddress: !!contractAddress,
          rpcUrl: !!rpcUrl
        }
      })
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
    const contract = new ethers.Contract(contractAddress, NFTContract.default.abi, provider)

    // Test 1: Basic contract calls
    console.log('Test 1: Basic contract calls')
    try {
      const owner = await contract.owner()
      const totalTokens = await contract.totalTokenTypes()
      const nextTokenId = await contract.nextTokenId()
      
      console.log('✅ Basic calls successful:', {
        owner,
        totalTokens: totalTokens.toString(),
        nextTokenId: nextTokenId.toString()
      })
    } catch (error) {
      console.log('❌ Basic calls failed:', error)
    }

    // Test 2: Check if mintNFT function exists
    console.log('Test 2: Check mintNFT function')
    try {
      const functionExists = contract.interface.hasFunction('mintNFT')
      console.log('✅ mintNFT function exists:', functionExists)
      
      if (functionExists) {
        const functionFragment = contract.interface.getFunction('mintNFT')
        if (functionFragment) {
          console.log('✅ mintNFT function signature:', functionFragment.format())
        }
      }
    } catch (error) {
      console.log('❌ Function check failed:', error)
    }

    // Test 3: Try to encode mintNFT call
    console.log('Test 3: Encode mintNFT call')
    try {
      const testUri = 'https://example.com/test.json'
      const encodedData = contract.interface.encodeFunctionData('mintNFT', [testUri, BigInt(1)])
      console.log('✅ Function encoding successful:', encodedData.substring(0, 10) + '...')
    } catch (error) {
      console.log('❌ Function encoding failed:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Basic tests completed - check server logs'
    })

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
