'use client'

import { useEffect, useState } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { useAccount, useConnect } from 'wagmi'

export function AutoConnectWallet() {
  const { isEthProviderAvailable } = useFrame()
  const { isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false)

  useEffect(() => {
    // Auto-connect wallet when the mini-app loads and wallet provider is available
    if (isEthProviderAvailable && !isConnected && !hasAttemptedConnect && !isPending) {
      console.log('Auto-connecting wallet...')
      setHasAttemptedConnect(true)
      
      // Add a small delay to ensure the SDK is fully loaded
      setTimeout(() => {
        try {
          connect({ connector: miniAppConnector() })
          console.log('Wallet auto-connect initiated')
        } catch (error) {
          console.error('Failed to auto-connect wallet:', error)
        }
      }, 1000)
    }
  }, [isEthProviderAvailable, isConnected, hasAttemptedConnect, isPending, connect])

  // This component doesn't render anything visible
  return null
}
