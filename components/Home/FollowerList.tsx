'use client'

import { useState } from 'react'
import { useFrame } from '@/components/farcaster-provider'

interface Follower {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  followerCount: number
  followingCount: number
  verifiedAddresses: string[]
}

interface FollowersResponse {
  success: boolean
  followers: Follower[]
  totalFollowers: number
  error?: string
  message?: string
}

export function FollowerList() {
  const { context } = useFrame()
  const [fid, setFid] = useState(context?.user?.fid?.toString() || '')
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFollowers = async () => {
    if (!fid.trim()) {
      setError('Please enter a valid FID')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/followers?fid=${fid}`)
      const data: FollowersResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch followers')
      }

      setFollowers(data.followers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setFollowers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchFollowers()
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
             <div className="text-center space-y-4">
         <h2 className="text-2xl font-bold">Top 7 Followers</h2>
         <p className="text-gray-300">
           Enter a FID to see the top 7 followers of that user
         </p>
       </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="number"
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            placeholder="Enter FID (e.g., 194)"
            className="flex-1 bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black rounded-md px-6 py-2 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-md p-4 text-red-300">
          {error}
        </div>
      )}

      {followers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Top {followers.length} Followers
          </h3>
          <div className="space-y-3">
            {followers.map((follower, index) => (
              <div
                key={follower.fid}
                className="bg-white/5 rounded-lg p-4 flex items-center space-x-4"
              >
                <div className="flex-shrink-0">
                  {follower.pfpUrl ? (
                    <img
                      src={follower.pfpUrl}
                      alt={follower.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">
                        {follower.displayName?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-white truncate">
                      {follower.displayName || 'Unknown'}
                    </h4>
                    <span className="text-gray-400 text-sm">
                      @{follower.username}
                    </span>
                    {follower.verifiedAddresses.length > 0 && (
                      <span className="text-blue-400 text-xs">✓</span>
                    )}
                  </div>
                  <div className="flex space-x-4 text-sm text-gray-400 mt-1">
                    <span>{follower.followerCount} followers</span>
                    <span>{follower.followingCount} following</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-gray-500 text-sm">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && followers.length === 0 && fid && (
        <div className="text-center text-gray-400">
          No followers found for this FID
        </div>
      )}
    </div>
  )
}
