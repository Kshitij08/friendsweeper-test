import { NextRequest, NextResponse } from 'next/server';

// Production endpoint that forwards to Cloudflare Worker
export async function POST(request: NextRequest) {
  try {
    const { imageData, gameResult } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Debug environment variables
    console.log('Environment variables:');
    console.log('CLOUDFLARE_WORKER_URL:', process.env.CLOUDFLARE_WORKER_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Forward the request to Cloudflare Worker
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
    
    console.log('Cloudflare Worker URL:', cloudflareWorkerUrl);
    console.log('Sending request to:', `${cloudflareWorkerUrl}/upload/board-image`);
    
    const response = await fetch(`${cloudflareWorkerUrl}/upload/board-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData,
        gameResult
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudflare Worker error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to upload image to Cloudflare',
          details: errorData.error || 'Unknown error'
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    console.log('Image uploaded to Cloudflare Worker:', result.key);
    console.log('Public URL:', result.publicUrl);

    return NextResponse.json({
      success: true,
      key: result.key,
      publicUrl: result.publicUrl,
      imageType: result.imageType,
      message: 'Board image uploaded successfully to Cloudflare'
    });

  } catch (error) {
    console.error('Error uploading image to Cloudflare:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
