import { useState, useEffect } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { MintNFTRequest, MintNFTResponse } from '@/types'
import { Marketplace } from './Marketplace'
import { useAccount, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'viem/chains'

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
  
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle')
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)

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

    setIsMinting(true)
    setMintStatus('minting')

    try {
      // Step 1: Prepare transaction data
      const mintRequest: MintNFTRequest = {
        gameResult,
        userFid: context?.user?.fid?.toString(),
        userAddress: address!
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

      // Step 2: User signs and sends transaction using Farcaster SDK
      console.log('User signing transaction...')
      const { transactionData } = result

      // Debug: Log the transaction data
      console.log('Transaction data received:', {
        to: transactionData.to,
        data: transactionData.data?.substring(0, 20) + '...',
        dataLength: transactionData.data?.length || 0,
        gasLimit: transactionData.gasLimit,
        gasPrice: transactionData.gasPrice,
        maxFeePerGas: transactionData.maxFeePerGas,
        maxPriorityFeePerGas: transactionData.maxPriorityFeePerGas
      })

      // Validate transaction data
      if (!transactionData.to || !transactionData.data) {
        throw new Error('Invalid transaction data: missing to address or data')
      }

      if (transactionData.data.length > 10000) {
        console.warn('⚠️ Transaction data is very long:', transactionData.data.length, 'characters')
      }

      // Get Farcaster SDK
      const sdk = await import('@farcaster/miniapp-sdk')
      const ethProvider = sdk.default.wallet.ethProvider
      
      if (!ethProvider) {
        throw new Error('Farcaster wallet provider not available')
      }

      // Prepare transaction parameters
      const txParams = {
        to: transactionData.to,
        data: transactionData.data,
        gas: `0x${parseInt(transactionData.gasLimit || '300000').toString(16)}` as `0x${string}`,
        maxFeePerGas: transactionData.maxFeePerGas ? `0x${parseInt(transactionData.maxFeePerGas).toString(16)}` as `0x${string}` : undefined,
        maxPriorityFeePerGas: transactionData.maxPriorityFeePerGas ? `0x${parseInt(transactionData.maxPriorityFeePerGas).toString(16)}` as `0x${string}` : undefined
      }

      // Remove undefined values
      Object.keys(txParams).forEach(key => {
        if ((txParams as any)[key] === undefined) {
          delete (txParams as any)[key]
        }
      })

      console.log('Sending transaction with Farcaster SDK:', txParams)

      // Try different approaches to send the transaction
      let hash = null
      
      // Helper function to send transaction with timeout
      const sendTransactionWithTimeout = async (params: any, timeoutMs: number = 30000): Promise<string> => {
        return Promise.race([
          ethProvider.request({
            method: 'eth_sendTransaction',
            params: [params]
          }) as Promise<string>,
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs)
          )
        ])
      }

      try {
        // Approach 1: Minimal parameters with proper formatting
        console.log('Trying with minimal parameters...')
        const minimalParams = {
          to: txParams.to,
          data: txParams.data,
          gas: txParams.gas
        }
        console.log('Minimal params:', minimalParams)
        
        hash = await sendTransactionWithTimeout(minimalParams, 15000)
        console.log('✅ Transaction sent successfully with minimal params')
      } catch (error) {
        console.log('❌ Minimal params failed:', error)
        
        try {
          // Approach 2: Basic parameters (no gas)
          console.log('Trying with basic parameters...')
          const basicParams = {
            to: txParams.to,
            data: txParams.data
          }
          console.log('Basic params:', basicParams)
          
          hash = await sendTransactionWithTimeout(basicParams, 15000)
          console.log('✅ Transaction sent successfully with basic params')
        } catch (error2) {
          console.log('❌ Basic params failed:', error2)
          
          try {
            // Approach 3: Use gasPrice instead of maxFeePerGas
            console.log('Trying with gasPrice...')
            const gasPriceParams = {
              to: txParams.to,
              data: txParams.data,
              gas: txParams.gas,
              gasPrice: `0x${parseInt(transactionData.gasPrice || '1000000').toString(16)}` as `0x${string}`
            }
            console.log('GasPrice params:', gasPriceParams)
            
            hash = await sendTransactionWithTimeout(gasPriceParams, 15000)
            console.log('✅ Transaction sent successfully with gasPrice')
          } catch (error3) {
            console.log('❌ GasPrice params failed:', error3)
            
            // Approach 4: Last resort - just to and data
            console.log('Trying with just to and data...')
            const lastResortParams = {
              to: txParams.to,
              data: txParams.data
            }
            console.log('Last resort params:', lastResortParams)
            
            hash = await sendTransactionWithTimeout(lastResortParams, 15000)
            console.log('✅ Transaction sent successfully with last resort params')
          }
        }
      }

      if (!hash) {
        throw new Error('Transaction failed to send - no hash returned')
      }

      console.log('Transaction sent successfully:', hash)

      // Step 3: Wait for transaction confirmation
      console.log('Waiting for transaction confirmation...')
      const { ethers } = await import('ethers')
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      
      const receipt = await provider.waitForTransaction(hash)
      if (!receipt) {
        throw new Error('Transaction receipt is null')
      }
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
        metadata: result.metadata || {
          name: 'Friendsweeper NFT',
          description: 'A Friendsweeper game NFT',
          image: '',
          attributes: []
        },
        imageUrl: result.imageUrl || ''
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
    if (chainId !== baseSepolia.id) {
      return 'Switch to Base Sepolia'
    }
    
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
    
    if (chainId !== baseSepolia.id) {
      return `${baseStyle} bg-yellow-600 hover:bg-yellow-700 text-white`
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
        disabled={isMinting || !isEthProviderAvailable || !gameResult.boardImage || !isConnected}
        className={getButtonStyle()}
      >
        {isMinting && (
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
