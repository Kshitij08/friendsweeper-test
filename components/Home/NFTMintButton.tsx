import { useState, useEffect } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { MintNFTResponse } from '@/types'
import { Marketplace } from './Marketplace'
import { useAccount } from 'wagmi'
import { baseSepolia } from 'viem/chains'
import { encodeFunctionData, parseAbi } from 'viem'
import sdk from '@farcaster/miniapp-sdk'

interface NFTMintButtonProps {
  gameResult: {
    gameWon: boolean
    grid: any[][]
    killedBy?: any
    followers: any[]
    boardImage?: string
    solvingTime?: number
  }
  onMintSuccess?: (response: MintNFTResponse) => void
  onMintError?: (error: string) => void
}

export function NFTMintButton({ gameResult, onMintSuccess, onMintError }: NFTMintButtonProps) {
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle')
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { isEthProviderAvailable, context } = useFrame()
  const { isConnected, chainId, address } = useAccount()

  const handleMintNFT = async () => {
    if (!isEthProviderAvailable) {
      onMintError?.('Farcaster wallet provider not available')
      return
    }

    if (!gameResult.boardImage) {
      onMintError?.('No board image available')
      return
    }

    console.log('Mint NFT clicked - Using direct Farcaster SDK')
    console.log('Wallet info:', {
      isEthProviderAvailable,
      chainId,
      address,
      hasBoardImage: !!gameResult.boardImage
    })

    setMintStatus('minting')
    setIsProcessing(true)

    try {
      // Create minimal metadata
      const metadata = {
        name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'}`,
        description: gameResult.gameWon ? 'Victory!' : 'Game Over!',
        image: gameResult.boardImage || 'https://friendsweeper-test.vercel.app/placeholder.png',
        attributes: [
          { trait_type: "Result", value: gameResult.gameWon ? "Victory" : "Defeat" },
          { trait_type: "Followers", value: gameResult.followers.length }
        ]
      }

      // Add killed by follower if game was lost
      if (!gameResult.gameWon && gameResult.killedBy) {
        metadata.attributes.push({
          trait_type: "Killed By",
          value: gameResult.killedBy.username || gameResult.killedBy.displayName || "Unknown"
        })
      }

      const metadataUri = JSON.stringify(metadata)
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS

      if (!contractAddress) {
        throw new Error('NFT contract address not configured')
      }

      console.log('Preparing contract call...')

      // Encode function data using viem
      const data = encodeFunctionData({
        abi: parseAbi([
          'function mintNFT(string metadataURI, uint256 amount) returns (uint256)'
        ]),
        functionName: 'mintNFT',
        args: [metadataUri, BigInt(1)],
      })

      console.log('Contract call data prepared:', {
        to: contractAddress,
        dataLength: data.length,
        metadataLength: metadataUri.length
      })

      // Use Farcaster SDK directly with timeout
      const ethProvider = sdk.wallet.ethProvider
      if (!ethProvider) {
        throw new Error('Ethereum provider not available')
      }

      console.log('Calling ethProvider.request...')
      
      // Create a promise with timeout
      const transactionPromise = ethProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: contractAddress as `0x${string}`,
          data: data,
          from: address || undefined,
        }]
      })

      // Add 15 second timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction request timed out')), 15000)
      )

      const txHash = await Promise.race([transactionPromise, timeoutPromise]) as string
      console.log('Transaction submitted:', txHash)

      // Wait for transaction confirmation using fetch
      console.log('Waiting for transaction confirmation...')
      const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
      
      let receipt = null
      let attempts = 0
      const maxAttempts = 30 // 30 attempts with 2 second intervals = 1 minute max

      while (!receipt && attempts < maxAttempts) {
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getTransactionReceipt',
              params: [txHash],
              id: 1
            })
          })

          const result = await response.json()
          if (result.result && result.result.status === '0x1') {
            receipt = result.result
            break
          }
        } catch (e) {
          console.log('Checking transaction status...', attempts + 1)
        }

        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        attempts++
      }

      if (!receipt) {
        throw new Error('Transaction confirmation timeout. Please check your wallet.')
      }

      console.log('Transaction confirmed:', receipt)

      // Extract token ID from logs
      let tokenId = null
      if (receipt.logs && Array.isArray(receipt.logs)) {
        for (const log of receipt.logs) {
          try {
            // Simple check for TransferSingle event
            if (log.topics && log.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') {
              if (log.topics.length >= 4 && log.topics[3]) {
                tokenId = Number(BigInt(log.topics[3]))
                break
              }
            }
          } catch (e) {
            // Continue to next log
          }
        }
      }

      setMintStatus('success')
      setMintedTokenId(tokenId)
      
      const mintResponse: MintNFTResponse = {
        success: true,
        tokenId: tokenId?.toString() || 'unknown',
        transactionHash: txHash,
        metadata: {
          name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'}`,
          description: gameResult.gameWon ? 'Victory!' : 'Game Over!',
          image: gameResult.boardImage || 'https://friendsweeper-test.vercel.app/placeholder.png',
          attributes: [
            { trait_type: "Result", value: gameResult.gameWon ? "Victory" : "Defeat" },
            { trait_type: "Followers", value: gameResult.followers.length }
          ]
        }
      }
      
      onMintSuccess?.(mintResponse)
      console.log('NFT minted successfully:', mintResponse)

    } catch (error) {
      setMintStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onMintError?.(errorMessage)
      console.error('NFT minting failed:', errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewMarketplace = () => {
    setShowMarketplace(true)
  }

  const handleCloseMarketplace = () => {
    setShowMarketplace(false)
  }

  if (showMarketplace) {
    return <Marketplace onClose={handleCloseMarketplace} />
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleMintNFT}
        disabled={isProcessing || mintStatus === 'minting' || !isEthProviderAvailable}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
          mintStatus === 'minting' || isProcessing
            ? 'bg-gray-500 text-white cursor-not-allowed'
            : mintStatus === 'success'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : mintStatus === 'error'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isProcessing || mintStatus === 'minting' ? (
          <>
            <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            {mintStatus === 'minting' ? 'Minting NFT...' : 'Processing...'}
          </>
        ) : mintStatus === 'success' ? (
          'NFT Minted Successfully! 🎉'
        ) : mintStatus === 'error' ? (
          'Mint Failed - Try Again'
        ) : (
          'Mint NFT'
        )}
      </button>

      {mintStatus === 'success' && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold">NFT Minted Successfully!</h3>
            {mintedTokenId && (
              <p className="text-green-700 text-sm mt-1">
                Token ID: {mintedTokenId}
              </p>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleViewMarketplace}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              View in Marketplace
            </button>
          </div>
        </div>
      )}

      {mintStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Minting Failed</h3>
          <p className="text-red-700 text-sm mt-1">
            Please try again. Make sure you have enough gas and are on the correct network.
          </p>
        </div>
      )}

      {!isEthProviderAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Wallet Not Available</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Please open this app in a Farcaster client to mint NFTs.
          </p>
        </div>
      )}
    </div>
  )
}
