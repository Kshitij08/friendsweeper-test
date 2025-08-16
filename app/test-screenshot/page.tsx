'use client'

import { useState, useRef } from 'react'

export default function TestScreenshot() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const testRef = useRef<HTMLDivElement>(null)

  const captureScreenshot = async () => {
    if (!testRef.current) return
    
    setLoading(true)
    try {
      console.log('Testing screenshot capture...')
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(testRef.current, {
        backgroundColor: '#1a202c',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })
      
      const dataUrl = canvas.toDataURL('image/png', 0.9)
      console.log('Test screenshot captured:', dataUrl.substring(0, 50) + '...')
      setImageUrl(dataUrl)
    } catch (error) {
      console.error('Failed to capture test screenshot:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Screenshot Test</h1>
        
        <button
          onClick={captureScreenshot}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg mb-8"
        >
          {loading ? 'Capturing...' : 'Capture Screenshot'}
        </button>

        <div ref={testRef} className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-700 shadow-2xl mb-8">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-white">Test Game Board</h2>
            <p className="text-gray-300">This is a test board to verify screenshot functionality</p>
          </div>
          
          <div className="grid grid-cols-8 gap-2 max-w-md mx-auto">
            {Array.from({ length: 64 }, (_, i) => (
              <div
                key={i}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14
                          flex items-center justify-center text-xs sm:text-sm md:text-base font-bold rounded-lg
                          bg-gradient-to-br from-gray-600 to-gray-700
                          border border-gray-500"
              >
                {i < 16 ? '💣' : i < 32 ? '1' : i < 48 ? '2' : '⬜'}
              </div>
            ))}
          </div>
        </div>

        {imageUrl && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Captured Screenshot:</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <img 
                src={imageUrl} 
                alt="Test Screenshot" 
                className="max-w-full h-auto border border-gray-600 rounded-lg"
              />
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Image Data URL:</h3>
              <code className="text-sm break-all bg-gray-700 p-2 rounded">
                {imageUrl.substring(0, 100)}...
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
