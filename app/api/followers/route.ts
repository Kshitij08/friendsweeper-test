import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY || '');

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

    if (process.env.NEYNAR_API_KEY === 'your_neynar_api_key_here') {
      console.error('NEYNAR_API_KEY is set to placeholder value');
      return NextResponse.json(
        { error: 'Please replace the placeholder NEYNAR_API_KEY with your actual API key from https://neynar.com/' },
        { status: 500 }
      );
    }

    // Get user's followers
    const followersResponse = await neynarClient.getUserFollowers({
      fid: parseInt(fid),
      limit: 5, // Get top 5 followers
    });

    // Get detailed information for each follower
    const followersWithDetails = await Promise.all(
      followersResponse.users.map(async (follower) => {
        try {
          const userInfo = await neynarClient.lookupUserByFid(follower.fid);
          return {
            fid: follower.fid,
            username: userInfo.result.user.username,
            displayName: userInfo.result.user.displayName,
            pfpUrl: userInfo.result.user.pfp.url,
            followerCount: userInfo.result.user.followerCount,
            followingCount: userInfo.result.user.followingCount,
            verifiedAddresses: userInfo.result.user.verifiedAddresses,
          };
        } catch (error) {
          console.error(`Error fetching details for FID ${follower.fid}:`, error);
          return {
            fid: follower.fid,
            username: 'Unknown',
            displayName: 'Unknown User',
            pfpUrl: '',
            followerCount: 0,
            followingCount: 0,
            verifiedAddresses: [],
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      followers: followersWithDetails,
      totalFollowers: followersResponse.users.length,
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
