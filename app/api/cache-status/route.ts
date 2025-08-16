import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/follower-cache';

export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      cacheStats: stats,
      message: 'Cache status retrieved successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to get cache status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
