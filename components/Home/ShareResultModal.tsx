'use client'

import { useState, useEffect } from 'react'
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

interface Cell {
  isBomb: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborBombs: number
  follower?: Follower
}

interface GameResult {
  gameWon: boolean
  grid: Cell[][]
  killedBy?: Follower
  followers: Follower[]
  boardImage?: string // Add the captured board image
  solvingTime?: number // Total solving time in seconds
}

interface ShareResultModalProps {
  isOpen: boolean
  onClose: () => void
  gameResult: GameResult
  onShare: () => Promise<void>
  isSharing: boolean
  userFid?: string
  onCaptureScreenshot?: () => Promise<string | null>
}

export function ShareResultModal({ 
  isOpen, 
  onClose, 
  gameResult, 
  onShare, 
  isSharing,
  userFid,
  onCaptureScreenshot
}: ShareResultModalProps) {
  const { actions } = useFrame()
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [publicImageUrl, setPublicImageUrl] = useState<string | null>(null)
  const [castText, setCastText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Generate cast text and image when modal opens
  useEffect(() => {
    if (isOpen && !imageDataUrl) {
      generateCastData()
    }
  }, [isOpen, imageDataUrl])

  const generateCastData = async () => {
    setIsLoading(true)
    try {
      console.log('Generating cast data...')
      
      // Generate cast text
      let text = ''
      const timeText = gameResult.solvingTime ? ` in ${Math.floor(gameResult.solvingTime / 60)}:${(gameResult.solvingTime % 60).toString().padStart(2, '0')}` : ''
      
      if (gameResult.gameWon) {
        const bombFollowers = gameResult.grid.flat()
          .filter(cell => cell.isBomb && cell.follower)
          .map(cell => cell.follower!)
        
        const followerMentions = bombFollowers
          .map(follower => `@${follower.username}`)
          .join(' ')
        
        text = `Avoided ${followerMentions} to win 100 points${timeText}! 🎉`
      } else {
        if (gameResult.killedBy) {
          text = `Got killed by @${gameResult.killedBy.username}, lost 100 points${timeText}. 💥`
        } else {
          text = `Game over! Lost 100 points${timeText}. 💥`
        }
      }
      setCastText(text)

      // Use the captured board image if available, otherwise generate one
      if (gameResult.boardImage) {
        console.log('Using pre-captured board image')
        console.log('Board image type:', gameResult.boardImage.substring(0, 30))
        setImageDataUrl(gameResult.boardImage)
        
        // Upload the image using the production Cloudflare API
        try {
          const uploadResponse = await fetch('/api/upload-board-image-production', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              imageData: gameResult.boardImage,
              gameResult: gameResult
            })
          })
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            console.log('Image uploaded successfully:', uploadResult.publicUrl)
            setPublicImageUrl(uploadResult.publicUrl)
          } else {
            console.log('Failed to upload image, using data URL as fallback')
            setPublicImageUrl(gameResult.boardImage)
          }
        } catch (error) {
          console.error('Error uploading image:', error)
          setPublicImageUrl(gameResult.boardImage)
        }
      } else {
        console.log('No captured board image, falling back to generation')
        // Fallback to generating board image
        const response = await fetch('/api/generate-board-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameResult, userFid })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Image generation result:', result)
          setImageDataUrl(result.imageDataUrl)
          setPublicImageUrl(result.publicUrl)
        }
      }
    } catch (error) {
      console.error('Error generating cast data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-2xl mx-4 border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <div className="text-4xl mb-4">
            {gameResult.gameWon ? '🎉' : '💥'}
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">
            {gameResult.gameWon ? 'Share Your Victory!' : 'Share Your Result!'}
          </h3>

          {/* Cast Text Preview */}
          <div className="bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-600">
            <h4 className="text-white font-semibold mb-2">Cast Preview:</h4>
            <p className="text-gray-200 text-sm break-words">
              {isLoading ? 'Generating...' : castText}
            </p>
          </div>

          {/* Board Image Preview */}
          {imageDataUrl && (
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-600">
              <h4 className="text-white font-semibold mb-2">Board Layout:</h4>
              <div className="flex justify-center">
                <img 
                  src={imageDataUrl} 
                  alt="Game Board" 
                  className="max-w-full h-auto rounded-lg border border-gray-600"
                />
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-300">Generating preview...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
                             onClick={async () => {
                 if (actions && castText) {
                   try {
                                           console.log('Casting with text:', castText)
                      console.log('Casting with image URL:', publicImageUrl)
                      console.log('Image URL type:', publicImageUrl?.substring(0, 30))
                     
                     // Try casting with the text-based image
                     await actions.composeCast({
                       text: castText,
                       embeds: publicImageUrl ? [publicImageUrl] : []
                     })
                     onClose()
                   } catch (error) {
                     console.error('Error casting:', error)
                     alert('Failed to cast. Please try again.')
                   }
                 } else {
                   await onShare()
                 }
               }}
              disabled={isSharing || isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-8 py-3 font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSharing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Share to Farcaster</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg px-8 py-3 font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
