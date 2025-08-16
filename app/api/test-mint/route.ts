import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== TESTING CONTRACT MINT FUNCTION ===')
  
  try {
    // Check environment variables
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL

    if (!contractAddress || !ownerPrivateKey || !rpcUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        env: {
          contractAddress: !!contractAddress,
          ownerPrivateKey: !!ownerPrivateKey,
          rpcUrl: !!rpcUrl
        }
      })
    }

    // Test contract connection
    const { ethers } = await import('ethers')
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(ownerPrivateKey, provider)
    
    const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
    const contract = new ethers.Contract(contractAddress, NFTContract.default.abi, signer)

    // Test 1: Check if we can call the contract
    console.log('Test 1: Testing contract connection...')
    let owner: string
    try {
      owner = await contract.owner()
      console.log('✅ Contract owner:', owner)
    } catch (error) {
      console.error('❌ Contract owner check failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Contract connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Test mint function parameters
    console.log('Test 2: Testing mint function parameters...')
    try {
      const testAddress = '0x1234567890123456789012345678901234567890'
      const testMetadataUri = 'data:application/json;base64,eyJuYW1lIjoidGVzdCJ9'
      const testAmount = BigInt(1)

      console.log('Parameters:', {
        to: testAddress,
        metadataURI: testMetadataUri,
        amount: testAmount.toString()
      })

      // Just test the parameter encoding, don't actually mint
      const encodedData = contract.interface.encodeFunctionData('mint', [
        testAddress,
        testMetadataUri,
        testAmount
      ])
      
      console.log('✅ Function encoding successful:', encodedData.substring(0, 10) + '...')
      
      return NextResponse.json({
        success: true,
        message: 'Contract mint function test successful',
        contractOwner: owner,
        functionEncoding: encodedData.substring(0, 10) + '...'
      })

    } catch (error) {
      console.error('❌ Mint function test failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Mint function test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
