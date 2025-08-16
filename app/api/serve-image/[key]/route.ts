import { NextRequest, NextResponse } from 'next/server';
import { getImage, getStorageStats } from '@/lib/image-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key);
    
    console.log('Serving image request for key:', key);
    
    // Get storage stats for debugging
    const stats = getStorageStats();
    console.log('Current storage stats:', stats);
    
    // Get the stored image data from shared storage
    const storedImage = getImage(key);
    
    if (!storedImage) {
      console.log('Image not found in storage:', key);
      console.log('Available keys:', stats.keys);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    console.log('Image found, serving:', key);
    
    // Convert data URL to buffer
    const base64Data = storedImage.data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Return the image with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': storedImage.contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
