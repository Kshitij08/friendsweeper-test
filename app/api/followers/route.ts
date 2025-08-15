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

    // Fetch followers using Neynar API
    const followersResponse = await neynarClient.fetchUserFollowers({
      fid: parseInt(fid),
      limit: 5, // Get top 5 followers
      viewerFid: parseInt(fid) // Use the same FID as viewer for context
    });

    if (!followersResponse || !followersResponse.users) {
      return NextResponse.json(
        { error: 'Failed to fetch followers from Neynar API' },
        { status: 500 }
      );
    }

    // Transform the response to match our expected format
    const followers = followersResponse.users.map((user: any) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || '',
      followerCount: user.follower_count,
      followingCount: user.following_count,
      verifiedAddresses: user.verified_addresses?.eth_addresses || []
    }));

    return NextResponse.json({
      success: true,
      followers: followers,
      totalFollowers: followersResponse.users.length,
      message: `Found ${followers.length} followers`
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
