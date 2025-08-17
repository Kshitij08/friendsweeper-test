import { useState, useEffect } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { MintNFTResponse } from '@/types'
import { Marketplace } from './Marketplace'
import { useAccount, useSwitchChain, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { baseSepolia } from 'viem/chains'
import { encodeFunctionData } from 'viem'

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

  const { isEthProviderAvailable, context } = useFrame()
  const { isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  
  // Use Wagmi hooks as recommended by Farcaster documentation
  const { data: hash, sendTransaction, isPending, error: sendError } = useSendTransaction()
  
  // Wait for transaction receipt
  const { data: receipt, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle chain switching if needed
  useEffect(() => {
    if (isConnected && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id })
    }
  }, [isConnected, chainId, switchChain])

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && receipt && hash) {
      console.log('Transaction confirmed:', hash)
      
      // Extract token ID from logs
      let tokenId = null
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
      if (contractAddress) {
        // Try to extract token ID from logs
        for (const log of receipt.logs) {
          try {
            // Simple check for TransferSingle event
            if (log.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') {
              // This is a TransferSingle event, extract token ID from topics
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
        transactionHash: hash,
        metadata: {
          name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'}`,
          description: gameResult.gameWon ? 'Victory!' : 'Game Over!',
          image: 'https://friendsweeper-test.vercel.app/placeholder.png',
          attributes: [
            { trait_type: "Result", value: gameResult.gameWon ? "Victory" : "Defeat" },
            { trait_type: "Followers", value: gameResult.followers.length }
          ]
        }
      }
      
      onMintSuccess?.(mintResponse)
      console.log('NFT minted successfully:', mintResponse)
    }
  }, [isSuccess, receipt, hash, gameResult, onMintSuccess])

  // Handle transaction error
  useEffect(() => {
    if (isError || sendError) {
      setMintStatus('error')
      const errorMessage = sendError?.message || 'Transaction failed'
      onMintError?.(errorMessage)
      console.error('Transaction error:', sendError)
    }
  }, [isError, sendError, onMintError])

  const handleMintNFT = async () => {
    if (!isEthProviderAvailable || !isConnected || chainId !== baseSepolia.id) {
      onMintError?.('Wallet not connected or wrong network')
      return
    }

    if (!gameResult.boardImage) {
      onMintError?.('No board image available')
      return
    }

    console.log('Mint NFT clicked - Debug info:', {
      isEthProviderAvailable,
      isConnected,
      chainId,
      hasBoardImage: !!gameResult.boardImage,
      contextUser: context?.user
    })

    setMintStatus('minting')

    try {
      // Create minimal metadata to keep transaction size small
      const metadata = {
        name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'}`,
        description: gameResult.gameWon ? 'Victory!' : 'Game Over!',
        image: 'https://friendsweeper-test.vercel.app/placeholder.png',
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

      // Use minimal metadata URI to minimize transaction size
      const metadataUri = JSON.stringify(metadata)

      // Encode the mintNFT function call
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
      if (!contractAddress) {
        throw new Error('NFT contract address not configured')
      }

      const mintData = encodeFunctionData({
        abi: [{
          inputs: [
            { name: 'metadataURI', type: 'string' },
            { name: 'amount', type: 'uint256' }
          ],
          name: 'mintNFT',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'nonpayable',
          type: 'function'
        }],
        args: [metadataUri, BigInt(1)]
      })

      console.log('Sending transaction with Wagmi...')
      console.log('Transaction details:', {
        to: contractAddress,
        data: mintData.substring(0, 20) + '...',
        gas: '0x493e0'
      })

      // Use Wagmi's sendTransaction as recommended by Farcaster documentation
      sendTransaction({
        to: contractAddress as `0x${string}`,
        data: mintData,
        gas: BigInt(300000),
      })

    } catch (error) {
      setMintStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onMintError?.(errorMessage)
      console.error('Error preparing transaction:', error)
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
        disabled={isPending || mintStatus === 'minting' || !isEthProviderAvailable || !isConnected || chainId !== baseSepolia.id}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
          isPending || mintStatus === 'minting'
            ? 'bg-gray-500 text-white cursor-not-allowed'
            : mintStatus === 'success'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : mintStatus === 'error'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isPending || mintStatus === 'minting' ? (
          <>
            <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Signing Transaction...
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

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Wallet Not Connected</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Please connect your wallet to mint an NFT.
          </p>
        </div>
      )}

      {isConnected && chainId !== baseSepolia.id && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Wrong Network</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Please switch to Base Sepolia to mint NFTs.
          </p>
        </div>
      )}
    </div>
  )
}
