import { NextRequest, NextResponse } from 'next/server';
import { storeImage } from '@/lib/image-storage';

// Validate base64 image data (following GitHub repo pattern)
function validateBase64Image(imageData: string): { isValid: boolean; imageType?: string; error?: string } {
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  const match = imageData.match(base64Pattern);
  
  if (!match) {
    return { 
      isValid: false, 
      error: 'Image must be a valid base64 data URL with data:image/type;base64, prefix' 
    };
  }
  
  return { isValid: true, imageType: match[1] };
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, gameResult } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Validate the base64 image data
    const validation = validateBase64Image(imageData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate a unique key for the image (following GitHub repo pattern)
    const key = `board-images/${Date.now()}_${Math.random().toString(36).substring(7)}.${validation.imageType}`;
    
    // Store the image data using shared storage
    storeImage(key, {
      data: imageData,
      contentType: `image/${validation.imageType}`,
      timestamp: Date.now(),
      metadata: {
        'game-result': gameResult?.gameWon ? 'win' : 'loss',
        'uploaded-at': new Date().toISOString(),
        'image-type': validation.imageType!,
      }
    });

    // Create the public URL
    const publicUrl = `${request.nextUrl.origin}/api/serve-image/${encodeURIComponent(key)}`;

    console.log('Image stored:', key);
    console.log('Public URL:', publicUrl);

    return NextResponse.json({
      success: true,
      key,
      publicUrl,
      imageType: validation.imageType,
      message: 'Board image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
