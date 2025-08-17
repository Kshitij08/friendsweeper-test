import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL

    if (!contractAddress || !rpcUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing environment variables' },
        { status: 500 }
      )
    }

    const { ethers } = await import('ethers')
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
    const contract = new ethers.Contract(contractAddress, NFTContract.default.abi, provider)

    // Test basic contract functions
    const results = {
      contractAddress,
      owner: await contract.owner(),
      totalTokenTypes: (await contract.totalTokenTypes()).toString(),
      nextTokenId: (await contract.nextTokenId()).toString(),
      hasMintNFTFunction: contract.interface.hasFunction('mintNFT'),
      mintNFTFunctionSignature: contract.interface.getFunction('mintNFT')?.format(),
      functionCount: contract.interface.fragments.length
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Contract test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
