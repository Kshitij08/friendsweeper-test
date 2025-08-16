import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('Test mint endpoint called')
  
  try {
    // Check environment variables
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS
    const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL

    console.log('Environment check:', {
      contractAddress: contractAddress ? 'Set' : 'Missing',
      ownerPrivateKey: ownerPrivateKey ? 'Set' : 'Missing',
      rpcUrl: rpcUrl ? 'Set' : 'Missing'
    })

    // Try to parse the request body
    const body = await request.json()
    console.log('Request body received:', { hasBody: !!body })

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      envCheck: {
        contractAddress: !!contractAddress,
        ownerPrivateKey: !!ownerPrivateKey,
        rpcUrl: !!rpcUrl
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
