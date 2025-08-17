import { useState, useEffect } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { MintNFTResponse } from '@/types'
import { Marketplace } from './Marketplace'
import { useAccount, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'viem/chains'
import { encodeFunctionData } from 'viem'
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

  const { isEthProviderAvailable, context } = useFrame()
  const { isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  // Handle chain switching if needed
  useEffect(() => {
    if (isConnected && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id })
    }
  }, [isConnected, chainId, switchChain])

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
      // Create a simple metadata URI without the large image data
      const metadata = {
        name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'} #${Date.now()}`,
        description: gameResult.gameWon
          ? `A victorious Friendsweeper game where the player avoided all ${gameResult.followers.length} followers and won!`
          : `A Friendsweeper game where the player was defeated by a follower.`,
        image: gameResult.boardImage, // This will be the uploaded image URL
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

      // Use a simple string instead of base64 encoded data to reduce transaction size
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

      console.log('Sending transaction with Farcaster SDK...')
      console.log('Transaction details:', {
        to: contractAddress,
        data: mintData.substring(0, 20) + '...',
        gas: '0x493e0'
      })

      // Use Farcaster SDK directly as per official documentation
      const txHash = await sdk.wallet.ethProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: contractAddress as `0x${string}`,
          data: mintData,
          gas: '0x493e0', // 300000 in hex
        }]
      })

      console.log('Transaction sent:', txHash)

      // Wait for transaction confirmation
      const provider = new (await import('ethers')).JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)
      const receipt = await provider.waitForTransaction(txHash as string)
      
      console.log('Transaction confirmed:', receipt)

      // Extract token ID from TransferSingle event
      let tokenId: number | null = null
      if (receipt) {
        for (const log of receipt.logs) {
          if (log.topics[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') { // TransferSingle event
            if (log.topics.length >= 4 && log.topics[3]) {
              tokenId = Number(BigInt(log.topics[3]))
              break
            }
          }
        }
      }

      setMintedTokenId(tokenId)
      setMintStatus('success')

      onMintSuccess?.({
        success: true,
        tokenId: tokenId?.toString() || '0',
        transactionHash: txHash as string,
        metadata: metadata
      })

    } catch (error) {
      setMintStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onMintError?.(errorMessage)
      console.error('NFT minting failed:', error)
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
        disabled={mintStatus === 'minting' || !isEthProviderAvailable || !isConnected || chainId !== baseSepolia.id}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
          mintStatus === 'minting'
            ? 'bg-gray-500 text-white cursor-not-allowed'
            : mintStatus === 'success'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : mintStatus === 'error'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {mintStatus === 'minting' && 'Minting NFT...'}
        {mintStatus === 'success' && 'NFT Minted Successfully! 🎉'}
        {mintStatus === 'error' && 'Mint Failed - Try Again'}
        {mintStatus === 'idle' && 'Mint NFT'}
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
