import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, you'd use a database or file storage
const imageCache = new Map<string, { svg: string; timestamp: number }>();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const cached = imageCache.get(id);
    
    if (!cached) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Check if cache is expired (1 hour)
    if (Date.now() - cached.timestamp > 3600000) {
      imageCache.delete(id);
      return NextResponse.json({ error: 'Image expired' }, { status: 404 });
    }
    
    // Return SVG with proper headers
    return new NextResponse(cached.svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { svg } = await request.json();
    
    // Store SVG in cache
    imageCache.set(id, {
      svg,
      timestamp: Date.now(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to store image' },
      { status: 500 }
    );
  }
}
