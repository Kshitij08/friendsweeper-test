'use client'

import { useState, useEffect } from 'react'
import { HomePage } from './HomePage'
import { AutoConnectWallet } from './AutoConnectWallet'
import { useAccount, useConnect } from 'wagmi'
import { useFrame } from '@/components/farcaster-provider'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

export function Demo() {
  const { isConnected } = useAccount()
  const { isEthProviderAvailable } = useFrame()
  const { connect } = useConnect()
  const [showConnectingMessage, setShowConnectingMessage] = useState(false)
  const [showConnectedMessage, setShowConnectedMessage] = useState(false)
  const [showManualConnect, setShowManualConnect] = useState(false)

  useEffect(() => {
    // Show connecting message when wallet provider is available but not connected
    if (isEthProviderAvailable && !isConnected) {
      setShowConnectingMessage(true)
      setShowConnectedMessage(false)
      // Show manual connect option after 3 seconds if still not connected
      const timeoutId = setTimeout(() => {
        if (!isConnected) {
          setShowManualConnect(true)
        }
      }, 3000)
      return () => clearTimeout(timeoutId)
    } else if (isConnected) {
      setShowConnectingMessage(false)
      setShowConnectedMessage(true)
      setShowManualConnect(false)
      // Hide success message after 3 seconds
      setTimeout(() => setShowConnectedMessage(false), 3000)
    } else {
      setShowConnectingMessage(false)
      setShowConnectedMessage(false)
      setShowManualConnect(false)
    }
  }, [isEthProviderAvailable, isConnected])

  const handleManualConnect = () => {
    try {
      connect({ connector: miniAppConnector() })
    } catch (error) {
      console.error('Manual connection failed:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      <AutoConnectWallet />
      
      {showConnectingMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          🔗 Auto-connecting wallet...
        </div>
      )}
      
      {showManualConnect && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <span>⚠️ Auto-connection failed</span>
          <button
            onClick={handleManualConnect}
            className="bg-white text-yellow-600 px-2 py-1 rounded text-sm font-medium hover:bg-gray-100"
          >
            Connect Manually
          </button>
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
