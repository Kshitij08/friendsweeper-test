import { NextRequest, NextResponse } from 'next/server';
import { getStorageStats } from '@/lib/image-storage';

export async function GET(request: NextRequest) {
  try {
    const stats = getStorageStats();
    
    return NextResponse.json({
      success: true,
      storage: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get storage stats' },
      { status: 500 }
    );
  }
}
