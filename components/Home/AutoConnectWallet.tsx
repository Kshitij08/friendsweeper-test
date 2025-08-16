'use client'

import { useEffect } from 'react'
import { useFrame } from '@/components/farcaster-provider'

export function AutoConnectWallet() {
  const { isEthProviderAvailable } = useFrame()

  useEffect(() => {
    // Log wallet availability status
    if (isEthProviderAvailable) {
      console.log('✅ Farcaster wallet provider is available')
    } else {
      console.log('⚠️ Farcaster wallet provider not available')
    }
  }, [isEthProviderAvailable])

  // This component doesn't render anything visible
  return null
}
