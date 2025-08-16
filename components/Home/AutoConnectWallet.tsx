'use client'

import { useEffect, useState } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { useAccount, useConnect } from 'wagmi'

export function AutoConnectWallet() {
  const { isEthProviderAvailable } = useFrame()
  const { isConnected } = useAccount()
  const { connect } = useConnect()
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Auto-connect wallet when the mini-app loads and wallet provider is available
    if (isEthProviderAvailable && !isConnected && !isConnecting) {
      console.log('Auto-connecting wallet...')
      setIsConnecting(true)
      
      // Add a small delay to ensure the SDK is fully loaded
      setTimeout(() => {
        connect({ connector: miniAppConnector() })
          .then(() => {
            console.log('Wallet auto-connected successfully')
          })
          .catch((error) => {
            console.error('Failed to auto-connect wallet:', error)
          })
          .finally(() => {
            setIsConnecting(false)
          })
      }, 1000)
    }
  }, [isEthProviderAvailable, isConnected, isConnecting, connect])

  // This component doesn't render anything visible
  return null
}
