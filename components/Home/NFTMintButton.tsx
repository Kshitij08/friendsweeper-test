import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { useFrame } from '@/components/farcaster-provider'
import { MintNFTRequest, MintNFTResponse } from '@/types'
import { Marketplace } from './Marketplace'

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
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { context } = useFrame()
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle')
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)

  const handleMintNFT = async () => {
    if (!address) {
      onMintError?.('Wallet not connected')
      return
    }

    if (!walletClient) {
      onMintError?.('Wallet client not available')
      return
    }

    if (!gameResult.boardImage) {
      onMintError?.('No board image available')
      return
    }

    setIsMinting(true)
    setMintStatus('minting')

    try {
      // Step 1: Prepare transaction data
      const mintRequest: MintNFTRequest = {
        gameResult,
        userFid: context?.user?.fid?.toString(),
        userAddress: address
      }

      console.log('Preparing transaction data...')
      const response = await fetch('/api/mint-nft-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mintRequest)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to prepare transaction')
      }

      // Step 2: User signs and sends transaction
      console.log('User signing transaction...')
      const { transactionData } = result

      const hash = await walletClient.sendTransaction({
        to: transactionData.to as `0x${string}`,
        data: transactionData.data as `0x${string}`,
        gas: BigInt(transactionData.gasLimit),
        maxFeePerGas: BigInt(transactionData.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(transactionData.maxPriorityFeePerGas)
      })

      console.log('Transaction sent:', hash)

      // Step 3: Wait for transaction confirmation
      console.log('Waiting for transaction confirmation...')
      const { ethers } = await import('ethers')
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      
      const receipt = await provider.waitForTransaction(hash)
      console.log('Transaction confirmed:', receipt.hash)

      // Step 4: Extract token ID from logs
      let tokenId = null
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
      if (contractAddress) {
        const NFTContract = await import('@/lib/contracts/FriendsweeperNFT.json')
        const contract = new ethers.Contract(contractAddress, NFTContract.default.abi, provider)
        
        for (const log of receipt.logs) {
          try {
            const decodedLog = contract.interface.parseLog(log)
            if (decodedLog && decodedLog.name === 'TransferSingle') {
              tokenId = decodedLog.args.id.toString()
              break
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
        metadata: result.metadata,
        imageUrl: result.imageUrl
      }
      
      onMintSuccess?.(mintResponse)
      console.log('NFT minted successfully:', mintResponse)

    } catch (error) {
      setMintStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onMintError?.(errorMessage)
      console.error('Error minting NFT:', error)
    } finally {
      setIsMinting(false)
    }
  }

  const getButtonText = () => {
    switch (mintStatus) {
      case 'minting':
        return 'Sign Transaction...'
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
    
    switch (mintStatus) {
      case 'success':
        return `${baseStyle} bg-green-600 hover:bg-green-700 text-white`
      case 'error':
        return `${baseStyle} bg-red-600 hover:bg-red-700 text-white`
      default:
        return `${baseStyle} bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl`
    }
  }

  return (
    <>
      <div className="space-y-3">
      <button
        onClick={handleMintNFT}
        disabled={isMinting || !address || !gameResult.boardImage}
        className={getButtonStyle()}
      >
        {isMinting && (
          <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        )}
        {getButtonText()}
      </button>
      
      {!address && (
        <p className="text-sm text-blue-400 text-center">
          🔗 Connecting wallet automatically...
        </p>
      )}
      
      {address && !gameResult.boardImage && (
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
