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
  const { context, isEthProviderAvailable } = useFrame()
  const { isConnected, address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { sendTransaction, data: hash, isPending, error: sendError } = useSendTransaction()
  
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle')
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)

  // Wait for transaction receipt
  const { data: receipt, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  })

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
                tokenId = BigInt(log.topics[3]).toString()
                break
              }
            }
          } catch (e) {
            // Continue to next log
          }
        }
      }

      setMintStatus('success')
      setMintedTokenId(tokenId || 'unknown')
      
      const mintResponse: MintNFTResponse = {
        success: true,
        tokenId: tokenId || 'unknown',
        transactionHash: hash,
        metadata: {
          name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'} #${Date.now()}`,
          description: gameResult.gameWon 
            ? `A victorious Friendsweeper game where the player avoided all ${gameResult.followers.length} followers and won!`
            : `A Friendsweeper game where the player was defeated by a follower.`,
          image: gameResult.boardImage || '',
          external_url: 'https://friendsweeper-test.vercel.app',
          attributes: [
            { trait_type: "Result", value: gameResult.gameWon ? "Victory" : "Defeat" },
            { trait_type: "Followers Count", value: gameResult.followers.length },
            { trait_type: "Game Type", value: "Friendsweeper" },
            { trait_type: "Board Size", value: `${gameResult.grid.length}x${gameResult.grid[0]?.length || 0}` },
            { trait_type: "Date", value: new Date().toISOString().split('T')[0] }
          ]
        },
        imageUrl: gameResult.boardImage || ''
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
    console.log('Mint NFT clicked - Debug info:', {
      isEthProviderAvailable,
      isConnected,
      chainId,
      hasBoardImage: !!gameResult.boardImage,
      contextUser: context?.user
    })

    if (!isEthProviderAvailable) {
      onMintError?.('Farcaster wallet not available')
      return
    }

    if (!isConnected) {
      onMintError?.('Wallet not connected')
      return
    }

    if (chainId !== baseSepolia.id) {
      console.log('Switching to Base Sepolia...')
      switchChain({ chainId: baseSepolia.id })
      return
    }

    if (!gameResult.boardImage) {
      onMintError?.('No board image available')
      return
    }

    setMintStatus('minting')

    try {
      // Create a simple metadata URI for now
      const metadata = {
        name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'} #${Date.now()}`,
        description: gameResult.gameWon 
          ? `A victorious Friendsweeper game where the player avoided all ${gameResult.followers.length} followers and won!`
          : `A Friendsweeper game where the player was defeated by a follower.`,
        image: gameResult.boardImage,
        external_url: 'https://friendsweeper-test.vercel.app',
        attributes: [
          { trait_type: "Result", value: gameResult.gameWon ? "Victory" : "Defeat" },
          { trait_type: "Followers Count", value: gameResult.followers.length },
          { trait_type: "Game Type", value: "Friendsweeper" },
          { trait_type: "Board Size", value: `${gameResult.grid.length}x${gameResult.grid[0]?.length || 0}` },
          { trait_type: "Date", value: new Date().toISOString().split('T')[0] }
        ]
      }

      // Add killed by follower if game was lost
      if (!gameResult.gameWon && gameResult.killedBy) {
        metadata.attributes.push({
          trait_type: "Killed By",
          value: gameResult.killedBy.username || gameResult.killedBy.displayName || "Unknown"
        })
      }

      // Create metadata URI (base64 encoded data URL)
      const metadataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`
      
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

      console.log('Sending transaction with wagmi...')
      
      // Use the same pattern as WalletActions
      sendTransaction({
        to: contractAddress as `0x${string}`,
        data: mintData,
        gas: BigInt(300000), // Conservative gas limit
      })

    } catch (error) {
      setMintStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onMintError?.(errorMessage)
      console.error('Error preparing transaction:', error)
    }
  }

  const getButtonText = () => {
    if (chainId !== baseSepolia.id) {
      return 'Switch to Base Sepolia'
    }
    
    if (isPending) {
      return 'Sign Transaction...'
    }
    
    switch (mintStatus) {
      case 'success':
        return 'NFT Minted! 🎉'
      case 'error':
        return 'Mint Failed - Try Again'
      default:
        return 'Mint as NFT 🖼️ (Pay Gas)'
    }
  }

  const getButtonStyle = () => {
    const baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    
    if (chainId !== baseSepolia.id) {
      return `${baseStyle} bg-yellow-600 hover:bg-yellow-700 text-white`
    }
    
    if (isPending) {
      return `${baseStyle} bg-blue-600 hover:bg-blue-700 text-white`
    }
    
    switch (mintStatus) {
      case 'success':
        return `${baseStyle} bg-green-600 hover:bg-green-700 text-white`
      case 'error':
        return `${baseStyle} bg-red-600 hover:bg-red-700 text-white`
      default:
        return `${baseStyle} bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl`
    }
  }

  const handleButtonClick = () => {
    if (chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id })
    } else {
      handleMintNFT()
    }
  }

  return (
    <>
      <div className="space-y-3">
        <button
          onClick={handleButtonClick}
          disabled={isPending || !isEthProviderAvailable || !gameResult.boardImage || !isConnected}
          className={getButtonStyle()}
        >
          {isPending && (
            <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          )}
          {getButtonText()}
        </button>
        
        {!isEthProviderAvailable && (
          <p className="text-sm text-blue-400 text-center">
            🔗 Connecting wallet automatically...
          </p>
        )}
        
        {!isConnected && isEthProviderAvailable && (
          <p className="text-sm text-yellow-400 text-center">
            🔗 Please connect your wallet first
          </p>
        )}
        
        {isConnected && chainId !== baseSepolia.id && (
          <p className="text-sm text-yellow-400 text-center">
            ⚠️ Please switch to Base Sepolia network
          </p>
        )}
        
        {isConnected && chainId === baseSepolia.id && !gameResult.boardImage && (
          <p className="text-sm text-gray-400 text-center">
            Board image required for NFT minting
          </p>
        )}
        
        {mintStatus === 'success' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-green-400">
              Your game board has been minted as an NFT! 🎉
            </p>
            <p className="text-xs text-gray-400">
              Check your wallet to view your NFT
            </p>
            {mintedTokenId && (
              <button
                onClick={() => setShowMarketplace(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🏪 Open Marketplace
              </button>
            )}
          </div>
        )}
        
        {mintStatus === 'error' && (
          <p className="text-sm text-red-400 text-center">
            Failed to mint NFT. Please try again.
          </p>
        )}
      </div>

      {/* Marketplace Modal */}
      {showMarketplace && mintedTokenId && (
        <Marketplace
          tokenId={mintedTokenId}
          onClose={() => setShowMarketplace(false)}
        />
      )}
    </>
  )
}
