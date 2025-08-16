import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import NFTContract from '@/lib/contracts/FriendsweeperNFT.json'

interface BuyNFTRequest {
  tokenId: string
  buyerAddress: string
}

interface BuyNFTResponse {
  success: boolean
  transactionHash?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<BuyNFTResponse>> {
  try {
    const { tokenId, buyerAddress }: BuyNFTRequest = await request.json()

    if (!tokenId || !buyerAddress) {
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

      // Get listing information
      const listing = await contract.getListing(tokenId)
      if (!listing.isListed) {
        return NextResponse.json(
          { success: false, error: 'NFT is not listed for sale' },
          { status: 400 }
        )
      }

      // Estimate gas for buying
      const gasEstimate = await contract.buyNFT.estimateGas(tokenId, { value: listing.price })
      console.log('Estimated gas for buying:', gasEstimate.toString())

      // Buy the NFT
      const tx = await contract.buyNFT(tokenId, {
        value: listing.price,
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100) // Add 20% buffer
      })

      console.log('NFT purchase transaction sent:', tx.hash)

      // Wait for transaction confirmation
      const receipt = await tx.wait(1) // Wait for 1 confirmation

      if (receipt.status === 1) {
        const response: BuyNFTResponse = {
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
      console.error('Error buying NFT:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Contract purchase failed'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error buying NFT:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
