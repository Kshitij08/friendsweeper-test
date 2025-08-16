import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'

interface Listing {
  seller: string
  price: string
  isListed: boolean
  listingTime: string
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

interface MarketplaceProps {
  tokenId?: string
  onClose?: () => void
}

export function Marketplace({ tokenId, onClose }: MarketplaceProps) {
  const { address } = useAccount()
  const [listing, setListing] = useState<Listing | null>(null)
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [listPrice, setListPrice] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch listing information
  useEffect(() => {
    if (tokenId) {
      fetchListing()
      fetchMetadata()
    }
  }, [tokenId])

  const fetchListing = async () => {
    if (!tokenId) return

    try {
      const response = await fetch('/api/marketplace/get-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenId })
      })

      const data = await response.json()
      if (data.success) {
        setListing(data.listing)
      }
    } catch (error) {
      console.error('Error fetching listing:', error)
    }
  }

  const fetchMetadata = async () => {
    if (!tokenId) return

    try {
      // This would need to be implemented based on your metadata storage
      // For now, we'll use a placeholder
      setMetadata({
        name: `Friendsweeper NFT #${tokenId}`,
        description: 'A unique Friendsweeper game result NFT',
        image: '/placeholder-nft.png',
        attributes: [
          { trait_type: 'Token ID', value: tokenId },
          { trait_type: 'Game Type', value: 'Friendsweeper' }
        ]
      })
    } catch (error) {
      console.error('Error fetching metadata:', error)
    }
  }

  const handleListNFT = async () => {
    if (!address || !tokenId || !listPrice) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Convert price to wei
      const priceInWei = ethers.parseEther(listPrice).toString()

      const response = await fetch('/api/marketplace/list-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          price: priceInWei,
          userAddress: address
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('NFT listed successfully!')
        setListPrice('')
        fetchListing() // Refresh listing data
      } else {
        setError(data.error || 'Failed to list NFT')
      }
    } catch (error) {
      setError('Error listing NFT')
      console.error('Error listing NFT:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNFT = async () => {
    if (!address || !tokenId || !listing) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/marketplace/buy-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          buyerAddress: address
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('NFT purchased successfully!')
        fetchListing() // Refresh listing data
      } else {
        setError(data.error || 'Failed to purchase NFT')
      }
    } catch (error) {
      setError('Error purchasing NFT')
      console.error('Error purchasing NFT:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (priceInWei: string) => {
    try {
      return ethers.formatEther(priceInWei) + ' ETH'
    } catch {
      return priceInWei + ' wei'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">NFT Marketplace</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {tokenId && (
          <div className="space-y-6">
            {/* NFT Info */}
            <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
              <h3 className="text-white font-semibold mb-2">NFT Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Token ID:</span>
                  <span className="text-white ml-2">#{tokenId}</span>
                </div>
                {metadata && (
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">{metadata.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Listing */}
            {listing && listing.isListed && (
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <h3 className="text-white font-semibold mb-2">Current Listing</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white ml-2 font-semibold">{formatPrice(listing.price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Seller:</span>
                    <span className="text-white ml-2 font-mono text-xs">
                      {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Listed:</span>
                    <span className="text-white ml-2">{formatTime(listing.listingTime)}</span>
                  </div>
                </div>

                {/* Buy Button */}
                {address && address !== listing.seller && (
                  <button
                    onClick={handleBuyNFT}
                    disabled={loading}
                    className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg px-6 py-3 font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : `Buy for ${formatPrice(listing.price)}`}
                  </button>
                )}
              </div>
            )}

            {/* List NFT Form */}
            {address && (!listing || !listing.isListed) && (
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <h3 className="text-white font-semibold mb-3">List NFT for Sale</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      placeholder="0.01"
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleListNFT}
                    disabled={loading || !listPrice}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-3 font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'List NFT'}
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Royalty Info */}
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Royalty Information</h4>
              <p className="text-blue-300 text-sm">
                This NFT has a 5% royalty fee that goes to the original creator on all sales.
              </p>
            </div>
          </div>
        )}

        {!address && (
          <div className="text-center py-8">
            <p className="text-gray-400">Please connect your wallet to use the marketplace</p>
          </div>
        )}
      </div>
    </div>
  )
}
