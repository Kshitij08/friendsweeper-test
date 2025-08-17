'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { useAccount, useConnect } from 'wagmi'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

export function AutoConnectWallet() {
  const { isEthProviderAvailable } = useFrame()
  const { isConnected } = useAccount()
  const { connect } = useConnect()
  const hasAttemptedConnection = useRef(false)

  useEffect(() => {
    // Log wallet availability status
    if (isEthProviderAvailable) {
      console.log('✅ Farcaster wallet provider is available')
    } else {
      console.log('⚠️ Farcaster wallet provider not available')
    }
  }, [isEthProviderAvailable])

  useEffect(() => {
    // Auto-connect when wallet provider is available but not connected
    if (isEthProviderAvailable && !isConnected && !hasAttemptedConnection.current) {
      console.log('🔄 Attempting to auto-connect wallet...')
      hasAttemptedConnection.current = true
      
      // Add a small delay to ensure everything is properly initialized
      const timeoutId = setTimeout(() => {
        try {
          connect({ connector: miniAppConnector() })
        } catch (error) {
          console.error('❌ Auto-connection failed:', error)
          hasAttemptedConnection.current = false // Reset flag on error
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [isEthProviderAvailable, isConnected, connect])

  // Reset connection attempt flag when wallet becomes available again
  useEffect(() => {
    if (!isEthProviderAvailable) {
      hasAttemptedConnection.current = false
    }
  }, [isEthProviderAvailable])

  // This component doesn't render anything visible
  return null
}
