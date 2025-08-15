import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

const neynarClient = new NeynarAPIClient(new Configuration({
  apiKey: process.env.NEYNAR_API_KEY || ''
}));

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEYNAR_API_KEY) {
      console.error('NEYNAR_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'NEYNAR_API_KEY environment variable is not set. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    // For now, return a placeholder response to fix the build
    // TODO: Implement proper Neynar API integration once the SDK issues are resolved
    return NextResponse.json({
      success: true,
      followers: [],
      totalFollowers: 0,
      message: 'Followers API temporarily disabled - Neynar SDK integration in progress'
    });

  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch followers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
