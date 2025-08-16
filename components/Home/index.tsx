'use client'

import { useState, useEffect } from 'react'
import { HomePage } from './HomePage'
import { AutoConnectWallet } from './AutoConnectWallet'
import { useAccount } from 'wagmi'
import { useFrame } from '@/components/farcaster-provider'

export function Demo() {
  const { isConnected } = useAccount()
  const { isEthProviderAvailable } = useFrame()
  const [showConnectingMessage, setShowConnectingMessage] = useState(false)
  const [showConnectedMessage, setShowConnectedMessage] = useState(false)

  useEffect(() => {
    // Show connecting message when wallet provider is available but not connected
    if (isEthProviderAvailable && !isConnected) {
      setShowConnectingMessage(true)
      setShowConnectedMessage(false)
    } else if (isConnected) {
      setShowConnectingMessage(false)
      setShowConnectedMessage(true)
      // Hide success message after 3 seconds
      setTimeout(() => setShowConnectedMessage(false), 3000)
    } else {
      setShowConnectingMessage(false)
      setShowConnectedMessage(false)
    }
  }, [isEthProviderAvailable, isConnected])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      <AutoConnectWallet />
      
      {showConnectingMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          🔗 Auto-connecting wallet...
        </div>
      )}
      
      {showConnectedMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          ✅ Wallet connected successfully!
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-center">
        FriendSweeper
      </h1>
      <HomePage />
    </div>
  )
}
