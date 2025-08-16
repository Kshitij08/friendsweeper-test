import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== SIMPLE CLOUDFLARE TEST ===')
  
  try {
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL
    console.log('Cloudflare Worker URL:', cloudflareWorkerUrl)

    if (!cloudflareWorkerUrl) {
      return NextResponse.json({
        success: false,
        error: 'CLOUDFLARE_WORKER_URL not configured'
      })
    }

    // Test 1: Health check
    console.log('Test 1: Health check...')
    let healthStatus = 'unknown'
    let healthResponse = ''
    
    try {
      const healthRes = await fetch(`${cloudflareWorkerUrl}/health`)
      healthStatus = healthRes.status.toString()
      healthResponse = await healthRes.text()
      console.log('Health check successful:', healthStatus, healthResponse)
    } catch (healthError) {
      console.error('Health check failed:', healthError)
      healthStatus = 'failed'
      healthResponse = healthError instanceof Error ? healthError.message : 'Unknown error'
    }

    // Test 2: Test image upload (which we know works)
    console.log('Test 2: Testing image upload...')
    let imageStatus = 'unknown'
    let imageResponse = ''
    
    try {
      // Create a simple test image (1x1 pixel PNG)
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      
      const imageRes = await fetch(`${cloudflareWorkerUrl}/upload/board-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: testImageBase64,
          gameResult: {
            gameWon: false,
            grid: [[1]],
            followers: []
          }
        })
      })
      
      imageStatus = imageRes.status.toString()
      imageResponse = await imageRes.text()
      console.log('Image upload test completed:', imageStatus, imageResponse)
    } catch (imageError) {
      console.error('Image upload test failed:', imageError)
      imageStatus = 'failed'
      imageResponse = imageError instanceof Error ? imageError.message : 'Unknown error'
    }

    // Test 3: Test metadata upload (the failing one)
    console.log('Test 3: Testing metadata upload...')
    let metadataStatus = 'unknown'
    let metadataResponse = ''
    
    try {
      const testMetadata = {
        name: 'Test NFT',
        description: 'Test description',
        image: 'https://example.com/image.png',
        attributes: []
      }

      const metadataString = JSON.stringify(testMetadata, null, 2)
      const metadataBase64 = `data:application/json;base64,${Buffer.from(metadataString).toString('base64')}`

      const metadataRes = await fetch(`${cloudflareWorkerUrl}/upload/nft-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: metadataBase64,
          contentType: 'application/json',
          type: 'metadata'
        })
      })
      
      metadataStatus = metadataRes.status.toString()
      metadataResponse = await metadataRes.text()
      console.log('Metadata upload test completed:', metadataStatus, metadataResponse)
    } catch (metadataError) {
      console.error('Metadata upload test failed:', metadataError)
      metadataStatus = 'failed'
      metadataResponse = metadataError instanceof Error ? metadataError.message : 'Unknown error'
    }

    return NextResponse.json({
      success: true,
      tests: {
        health: {
          status: healthStatus,
          response: healthResponse
        },
        image: {
          status: imageStatus,
          response: imageResponse
        },
        metadata: {
          status: metadataStatus,
          response: metadataResponse
        }
      },
      environment: {
        cloudflareWorkerUrl: cloudflareWorkerUrl ? 'Set' : 'Missing'
      }
    })

  } catch (error) {
    console.error('Simple Cloudflare test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
