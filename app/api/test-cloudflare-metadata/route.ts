import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING CLOUDFLARE METADATA UPLOAD ===')
    
    const testMetadata = {
      name: 'Test NFT',
      description: 'Test metadata for debugging',
      image: 'https://example.com/test.png',
      external_url: 'https://friendsweeper-test.vercel.app',
      attributes: [
        { trait_type: "Test", value: "Debug" }
      ]
    }

    console.log('Test metadata:', testMetadata)
    console.log('Cloudflare Worker URL:', process.env.CLOUDFLARE_WORKER_URL)

    // Convert metadata to base64 data URL as expected by Cloudflare Worker
    const metadataJson = JSON.stringify(testMetadata, null, 2)
    const metadataBase64 = btoa(metadataJson)
    const metadataDataUrl = `data:application/json;base64,${metadataBase64}`
    
    console.log('Metadata data URL length:', metadataDataUrl.length)
    
    const response = await fetch(`${process.env.CLOUDFLARE_WORKER_URL}/upload/nft-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: metadataDataUrl, // Cloudflare Worker expects this field name
        contentType: 'application/json',
        type: 'metadata'
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Success:', result)
      return NextResponse.json({
        success: true,
        result
      })
    } else {
      const errorText = await response.text()
      console.log('❌ Error response:', errorText)
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Exception:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
