import { NFTMetadata } from '@/types'

// Upload image to Cloudflare R2 bucket
export async function uploadToCloudflare(data: string, contentType: string = 'image/png', type: 'image' | 'metadata' = 'image'): Promise<string> {
  try {
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL
    
    if (!cloudflareWorkerUrl) {
      throw new Error('CLOUDFLARE_WORKER_URL environment variable not set')
    }

    console.log(`Uploading ${type} to Cloudflare:`, { dataLength: data.length, contentType })
    
    const endpoint = type === 'image' ? '/upload/board-image' : '/upload/nft-metadata'
    
    const response = await fetch(`${cloudflareWorkerUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: data,
        contentType: contentType,
        type: type
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Cloudflare upload failed: ${errorData.error || 'Unknown error'}`)
    }

    const result = await response.json()
    console.log(`${type} uploaded to Cloudflare:`, result.publicUrl)
    
    return result.publicUrl
  } catch (error) {
    console.error(`Error uploading ${type} to Cloudflare:`, error)
    throw error
  }
}

// Legacy function for backward compatibility - now uses Cloudflare
export async function uploadToIPFS(data: string, contentType: string = 'image/png'): Promise<string> {
  return uploadToCloudflare(data, contentType, 'image')
}

// Generate NFT metadata
export function generateNFTMetadata(gameResult: {
  gameWon: boolean
  grid: any[][]
  killedBy?: any
  followers: any[]
  boardImage?: string
  solvingTime?: number
}, imageUrl: string): NFTMetadata {
  const metadata: NFTMetadata = {
    name: `Friendsweeper ${gameResult.gameWon ? 'Victory' : 'Game Over'} #${Date.now()}`,
    description: gameResult.gameWon 
      ? `A victorious Friendsweeper game where the player avoided all ${gameResult.followers.length} followers and won! This NFT commemorates their strategic gameplay and survival skills.`
      : `A Friendsweeper game where the player was defeated by a follower. This NFT captures the moment of their demise in this social minesweeper game.`,
    image: imageUrl,
    external_url: process.env.NEXT_PUBLIC_URL || 'https://friendsweeper.xyz',
    attributes: [
      {
        trait_type: "Result",
        value: gameResult.gameWon ? "Victory" : "Defeat"
      },
      {
        trait_type: "Followers Count",
        value: gameResult.followers.length
      },
      {
        trait_type: "Game Type",
        value: "Friendsweeper"
      },
      {
        trait_type: "Board Size",
        value: `${gameResult.grid.length}x${gameResult.grid[0]?.length || 0}`
      }
    ]
  }

  // Add solving time if available
  if (gameResult.solvingTime) {
    const minutes = Math.floor(gameResult.solvingTime / 60)
    const seconds = gameResult.solvingTime % 60
    metadata.attributes.push({
      trait_type: "Solving Time",
      value: `${minutes}:${seconds.toString().padStart(2, '0')}`
    })
  }

  // Add killed by follower if game was lost
  if (!gameResult.gameWon && gameResult.killedBy) {
    metadata.attributes.push({
      trait_type: "Killed By",
      value: gameResult.killedBy.username || gameResult.killedBy.displayName || "Unknown"
    })
  }

  // Add difficulty based on follower count
  const followerCount = gameResult.followers.length
  let difficulty = "Easy"
  if (followerCount > 20) difficulty = "Hard"
  else if (followerCount > 10) difficulty = "Medium"
  
  metadata.attributes.push({
    trait_type: "Difficulty",
    value: difficulty
  })

  // Add date
  metadata.attributes.push({
    trait_type: "Date",
    value: new Date().toISOString().split('T')[0]
  })

  return metadata
}

// Upload metadata to Cloudflare R2 bucket
export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  const metadataString = JSON.stringify(metadata, null, 2)
  console.log('Uploading metadata to Cloudflare:', metadata)
  
  try {
    // Convert metadata to base64 for upload
    const metadataBase64 = `data:application/json;base64,${Buffer.from(metadataString).toString('base64')}`
    
    return await uploadToCloudflare(metadataBase64, 'application/json', 'metadata')
  } catch (error) {
    console.error('Error uploading metadata to Cloudflare:', error)
    throw error
  }
}

// Validate game result for NFT minting
export function validateGameResultForNFT(gameResult: any): { isValid: boolean; error?: string } {
  if (!gameResult) {
    return { isValid: false, error: 'Game result is required' }
  }

  if (typeof gameResult.gameWon !== 'boolean') {
    return { isValid: false, error: 'Game result must have a valid gameWon status' }
  }

  if (!Array.isArray(gameResult.grid) || gameResult.grid.length === 0) {
    return { isValid: false, error: 'Game result must have a valid grid' }
  }

  if (!Array.isArray(gameResult.followers)) {
    return { isValid: false, error: 'Game result must have a valid followers array' }
  }

  if (!gameResult.boardImage) {
    return { isValid: false, error: 'Board image is required for NFT minting' }
  }

  return { isValid: true }
}
