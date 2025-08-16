import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import NFTContract from '@/lib/contracts/FriendsweeperNFT.json'

interface GetListingRequest {
  tokenId: string
}

interface GetListingResponse {
  success: boolean
  listing?: {
    seller: string
    price: string
    isListed: boolean
    listingTime: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GetListingResponse>> {
  try {
    const { tokenId }: GetListingRequest = await request.json()

    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: 'Missing token ID' },
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
      // Setup provider
      const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        NFTContract.abi,
        provider
      )

      // Get listing information
      const listing = await contract.getListing(tokenId)

      const response: GetListingResponse = {
        success: true,
        listing: {
          seller: listing.seller,
          price: listing.price.toString(),
          isListed: listing.isListed,
          listingTime: listing.listingTime.toString()
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Error getting listing:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to get listing'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error getting listing:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
