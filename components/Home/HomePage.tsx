'use client'

import { useState, useEffect } from 'react'
import { useFrame } from '@/components/farcaster-provider'
import { Settings } from './Settings'
import { FollowerList } from './FollowerList'
import { Minesweeper } from './Minesweeper'

interface Follower {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  followerCount: number
  followingCount: number
  verifiedAddresses: string[]
}

export function HomePage() {
  const { context } = useFrame()
  const [showSettings, setShowSettings] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showMinesweeper, setShowMinesweeper] = useState(false)
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)

  const fetchFollowers = async () => {
    if (!context?.user?.fid) return

    setLoadingFollowers(true)
    try {
      const response = await fetch(`/api/followers?fid=${context.user.fid}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setFollowers(data.followers)
      } else {
        console.error('Failed to fetch followers:', data.error)
        setFollowers([])
      }
    } catch (error) {
      console.error('Error fetching followers:', error)
      setFollowers([])
    } finally {
      setLoadingFollowers(false)
    }
  }

  // Fetch followers when component mounts or when user FID changes
  useEffect(() => {
    if (context?.user?.fid) {
      fetchFollowers()
    }
  }, [context?.user?.fid])

  if (showSettings) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            ← Back
          </button>
        </div>
        <Settings />
      </div>
    )
  }

  if (showFollowers) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Followers</h2>
          <button
            onClick={() => setShowFollowers(false)}
            className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            ← Back
          </button>
        </div>
        <FollowerList />
      </div>
    )
  }

  if (showMinesweeper) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowMinesweeper(false)}
            className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            ← Back
          </button>
        </div>
        {loadingFollowers ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading your followers...</div>
          </div>
        ) : (
          <Minesweeper followers={followers} />
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl text-center space-y-8">
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
                     <div className="bg-white/5 rounded-lg p-4">
             <h4 className="font-semibold mb-2">👥 Follower Analytics</h4>
             <p className="text-sm text-gray-300">View top 8 followers of any Farcaster user</p>
           </div>
                     <div className="bg-white/5 rounded-lg p-4">
             <h4 className="font-semibold mb-2">🎮 Minesweeper Game</h4>
             <p className="text-sm text-gray-300">Classic 8x8 minesweeper with your top 8 followers as bombs</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => setShowMinesweeper(true)}
          className="bg-green-600 text-white rounded-md px-8 py-3 text-lg font-medium hover:bg-green-700 transition-colors"
        >
          🎮 Play Minesweeper
        </button>
        <button
          onClick={() => setShowFollowers(true)}
          className="bg-blue-600 text-white rounded-md px-8 py-3 text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Followers
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="bg-white text-black rounded-md px-8 py-3 text-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Explore Settings
        </button>
      </div>
    </div>
  )
}
