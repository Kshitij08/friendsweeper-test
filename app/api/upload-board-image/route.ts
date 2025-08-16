import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// Validate base64 image data
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

    // Generate a unique key for the image
    const key = `board-images/${Date.now()}_${Math.random().toString(36).substring(7)}.${validation.imageType}`;
    
    // Process the base64 image data
    const base64Data = imageData.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Upload to Cloudflare R2
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: `image/${validation.imageType}`,
      CacheControl: 'public, max-age=3600', // Cache for 1 hour
      Metadata: {
        'game-result': gameResult?.gameWon ? 'win' : 'loss',
        'uploaded-at': new Date().toISOString(),
      }
    });

    await r2Client.send(uploadCommand);

    // Create the public URL (following the GitHub repo pattern)
    const publicUrl = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.CLOUDFLARE_R2_BUCKET_NAME}/${key}`;

    console.log('Image uploaded to Cloudflare R2:', key);
    console.log('Public URL:', publicUrl);

    return NextResponse.json({
      success: true,
      key,
      publicUrl,
      imageType: validation.imageType,
      message: 'Board image uploaded successfully to Cloudflare R2'
    });

  } catch (error) {
    console.error('Error uploading image to Cloudflare R2:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
