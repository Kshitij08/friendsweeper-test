'use client'

import { useState } from 'react'

export default function TestBoardImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testImageGeneration = async () => {
    setLoading(true)
    try {
      // Create a mock game result
      const mockGameResult = {
        gameWon: false,
        grid: Array(8).fill(null).map((_, row) =>
          Array(8).fill(null).map((_, col) => ({
            isBomb: row === 0 && col < 3, // First 3 cells are bombs
            isRevealed: row > 0 || col >= 3,
            isFlagged: false,
            neighborBombs: row === 0 && col < 3 ? 0 : Math.floor(Math.random() * 3),
            follower: row === 0 && col < 3 ? {
              fid: 1000 + col,
              username: `testuser${col}`,
              displayName: `Test User ${col}`,
              pfpUrl: `https://picsum.photos/100/100?random=${col}`,
              followerCount: 100,
              followingCount: 50,
              verifiedAddresses: []
            } : undefined
          }))
        ),
        killedBy: {
          fid: 1000,
          username: 'testuser0',
          displayName: 'Test User 0',
          pfpUrl: 'https://picsum.photos/100/100?random=0',
          followerCount: 100,
          followingCount: 50,
          verifiedAddresses: []
        },
        followers: []
      }

             const response = await fetch('/api/generate-board-image', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ 
           gameResult: mockGameResult,
           userFid: 'test-user' // Use a test user FID
         })
       })

      if (response.ok) {
        const result = await response.json()
        console.log('Test result:', result)
        setImageUrl(result.publicUrl)
      } else {
        console.error('Failed to generate image')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Board Image Generation Test</h1>
        
        <button
          onClick={testImageGeneration}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg mb-8"
        >
          {loading ? 'Generating...' : 'Generate Test Image'}
        </button>

        {imageUrl && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Generated Image:</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <img 
                src={imageUrl} 
                alt="Test Board" 
                className="max-w-full h-auto border border-gray-600 rounded-lg"
              />
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Image URL:</h3>
              <code className="text-sm break-all bg-gray-700 p-2 rounded">
                {imageUrl}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
