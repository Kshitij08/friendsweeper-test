import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== DIRECT CLOUDFLARE WORKER TEST ===')
  
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
    try {
      const healthResponse = await fetch(`${cloudflareWorkerUrl}/health`)
      const healthText = await healthResponse.text()
      console.log('Health check status:', healthResponse.status)
      console.log('Health check response:', healthText)
    } catch (healthError) {
      console.error('Health check failed:', healthError)
    }

    // Test 2: Test metadata upload with minimal data
    console.log('Test 2: Testing metadata upload...')
    const testMetadata = {
      name: 'Test NFT',
      description: 'Test description',
      image: 'https://example.com/image.png',
      attributes: []
    }

    const metadataString = JSON.stringify(testMetadata, null, 2)
    const metadataBase64 = `data:application/json;base64,${Buffer.from(metadataString).toString('base64')}`

    console.log('Metadata base64 length:', metadataBase64.length)
    console.log('Metadata base64 starts with:', metadataBase64.substring(0, 50))

    const uploadResponse = await fetch(`${cloudflareWorkerUrl}/upload/nft-metadata`, {
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

    console.log('Upload response status:', uploadResponse.status)
    console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()))

    const uploadText = await uploadResponse.text()
    console.log('Upload response text:', uploadText)

    return NextResponse.json({
      success: true,
      healthCheck: {
        status: 'completed',
        response: uploadText
      },
      uploadTest: {
        status: uploadResponse.status,
        response: uploadText,
        isJson: (() => {
          try {
            JSON.parse(uploadText)
            return true
          } catch {
            return false
          }
        })()
      }
    })

  } catch (error) {
    console.error('Direct Cloudflare Worker test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
