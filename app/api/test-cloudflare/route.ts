import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== TESTING CLOUDFLARE WORKER ===')
  
  try {
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL
    console.log('Cloudflare Worker URL:', cloudflareWorkerUrl)

    if (!cloudflareWorkerUrl) {
      return NextResponse.json({
        success: false,
        error: 'CLOUDFLARE_WORKER_URL not configured'
      })
    }

    // Test 1: Simple metadata upload
    console.log('Test 1: Testing simple metadata upload...')
    const testMetadata = {
      name: 'Test NFT',
      description: 'Test description',
      image: 'https://example.com/image.png',
      attributes: []
    }

    const metadataString = JSON.stringify(testMetadata, null, 2)
    const metadataBase64 = `data:application/json;base64,${Buffer.from(metadataString).toString('base64')}`

    console.log('Sending metadata to Cloudflare Worker...')
    const response = await fetch(`${cloudflareWorkerUrl}/upload/nft-metadata`, {
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

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('Response text:', responseText)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Cloudflare Worker returned ${response.status}: ${responseText}`,
        status: response.status,
        responseText: responseText
      })
    }

    try {
      const responseJson = JSON.parse(responseText)
      return NextResponse.json({
        success: true,
        message: 'Cloudflare Worker test successful',
        response: responseJson
      })
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Cloudflare Worker returned invalid JSON',
        responseText: responseText,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      })
    }

  } catch (error) {
    console.error('Cloudflare Worker test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
