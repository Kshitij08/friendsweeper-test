'use client'

import { useState } from 'react'

export default function TestImageUpload() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [useProduction, setUseProduction] = useState(false)

  const generateTestImage = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Create a simple test image using Canvas
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext('2d')!
      
      // Draw a test pattern
      ctx.fillStyle = '#1a202c'
      ctx.fillRect(0, 0, 400, 300)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Test Board Image', 200, 100)
      
      ctx.font = '16px Arial'
      ctx.fillText('Generated for testing', 200, 130)
      ctx.fillText('Friendsweeper Game', 200, 150)
      
      // Add some game-like elements
      ctx.fillStyle = '#ff6b6b'
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(50 + i * 60, 200, 40, 40)
      }
      
      ctx.fillStyle = '#4ecdc4'
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(50 + i * 60, 250, 40, 40)
      }
      
      const dataUrl = canvas.toDataURL('image/png')
      setUploadedImage(dataUrl)
      
      // Choose API endpoint based on mode
      const endpoint = useProduction 
        ? '/api/upload-board-image-production'
        : '/api/upload-board-image-simple'
      
      // Upload the image
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: dataUrl,
          gameResult: {
            gameWon: true,
            grid: [],
            followers: []
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setPublicUrl(result.publicUrl)
        console.log('Upload successful:', result)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Upload error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const checkStorageStats = async () => {
    if (useProduction) {
      setError('Storage stats not available in production mode')
      return
    }
    
    try {
      const response = await fetch('/api/debug-storage')
      if (response.ok) {
        const result = await response.json()
        setStorageStats(result.storage)
        console.log('Storage stats:', result.storage)
      }
    } catch (err) {
      console.error('Error checking storage stats:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Image Upload Test</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
            <div className="flex items-center space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useProduction}
                  onChange={(e) => setUseProduction(e.target.checked)}
                  className="mr-2"
                />
                Use Production Mode (Cloudflare)
              </label>
            </div>
            <div className="text-sm text-gray-300 mb-4">
              {useProduction ? (
                <div>
                  <p>✅ Production Mode: Images will be uploaded to Cloudflare R2</p>
                  <p>🌐 Global CDN with sub-100ms latency</p>
                  <p>💰 Free tier: 100k requests/day, 10GB storage</p>
                </div>
              ) : (
                <div>
                  <p>🔄 Development Mode: Images stored in memory</p>
                  <p>⏰ Images expire after 1 hour</p>
                  <p>🧪 Perfect for testing and development</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Image Upload</h2>
            <div className="flex space-x-4">
              <button
                onClick={generateTestImage}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Generating & Uploading...' : 'Generate & Upload Test Image'}
              </button>
              {!useProduction && (
                <button
                  onClick={checkStorageStats}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Check Storage Stats
                </button>
              )}
            </div>
          </div>

          {storageStats && !useProduction && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Storage Stats (Development)</h2>
              <div className="bg-gray-700 p-4 rounded">
                <p><strong>Total Images:</strong> {storageStats.totalImages}</p>
                <p><strong>Keys:</strong></p>
                <ul className="list-disc list-inside text-sm text-gray-300">
                  {storageStats.keys.map((key: string) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 p-4 rounded-lg">
              <h3 className="font-semibold text-red-300">Error</h3>
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {uploadedImage && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Generated Image</h2>
              <img 
                src={uploadedImage} 
                alt="Generated test image" 
                className="border border-gray-600 rounded-lg max-w-full"
              />
            </div>
          )}

          {publicUrl && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                Uploaded Image ({useProduction ? 'Cloudflare R2' : 'Local Storage'})
              </h2>
              <div className="space-y-4">
                <img 
                  src={publicUrl} 
                  alt="Uploaded image" 
                  className="border border-gray-600 rounded-lg max-w-full"
                />
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-300">Public URL:</p>
                  <p className="text-xs text-blue-400 break-all">{publicUrl}</p>
                </div>
                <div className="flex space-x-4">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                  >
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(publicUrl)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
