import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData, gameResult } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Convert data URL to buffer
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique ID
    const imageId = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Upload to Cloudflare Images
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'image/png' }), `${imageId}.png`);
    formData.append('id', imageId);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload to Cloudflare Images');
    }

    const result = await response.json();
    const publicUrl = result.result.variants[0]; // Get the first variant URL

    console.log('Image uploaded to Cloudflare Images:', imageId);
    console.log('Public URL:', publicUrl);

    return NextResponse.json({
      success: true,
      imageId,
      publicUrl,
      message: 'Image uploaded successfully to Cloudflare Images'
    });

  } catch (error) {
    console.error('Error uploading image to Cloudflare Images:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
