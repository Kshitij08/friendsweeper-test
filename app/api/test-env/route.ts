import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envCheck = {
    NFT_CONTRACT_ADDRESS: !!process.env.NFT_CONTRACT_ADDRESS,
    CONTRACT_OWNER_PRIVATE_KEY: !!process.env.CONTRACT_OWNER_PRIVATE_KEY,
    BASE_SEPOLIA_RPC_URL: !!process.env.BASE_SEPOLIA_RPC_URL,
    BASE_MAINNET_RPC_URL: !!process.env.BASE_MAINNET_RPC_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  }

  return NextResponse.json({
    success: true,
    environmentVariables: envCheck,
    message: 'Environment variables check'
  })
}
