'use client'

import { useState } from 'react'
import { Settings } from './Settings'

export function HomePage() {
  const [showSettings, setShowSettings] = useState(false)

  if (showSettings) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
        <Settings />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl text-center space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Welcome to Base Farcaster MiniApp!</h2>
        <p className="text-lg text-gray-300">
          This template demonstrates all Mini App capabilities and lets you easily modify it to build your own Mini Apps.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">What's included:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold mb-2">👤 User Context</h4>
            <p className="text-sm text-gray-300">Access user information like username, FID, and profile picture</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold mb-2">⚡ Farcaster Actions</h4>
            <p className="text-sm text-gray-300">Compose casts, view profiles, and perform native actions</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold mb-2">💰 Wallet Integration</h4>
            <p className="text-sm text-gray-300">Connect wallet and send transactions on Base Sepolia</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold mb-2">🔔 Notifications</h4>
            <p className="text-sm text-gray-300">Send push notifications to users</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold mb-2">🖼️ Custom Images</h4>
            <p className="text-sm text-gray-300">Generate custom OG images with user data</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold mb-2">📳 Haptic Feedback</h4>
            <p className="text-sm text-gray-300">Trigger haptic feedback for better UX</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowSettings(true)}
        className="bg-white text-black rounded-md px-8 py-3 text-lg font-medium hover:bg-gray-100 transition-colors"
      >
        Explore Settings
      </button>
    </div>
  )
}
