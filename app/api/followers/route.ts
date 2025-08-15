import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    console.log('API called with FID:', fid);
    console.log('NEYNAR_API_KEY exists:', !!process.env.NEYNAR_API_KEY);

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

    console.log('Attempting to fetch followers for FID:', fid);

    // Use direct API call instead of SDK method
    const apiUrl = `https://api.neynar.com/v2/farcaster/followers/?fid=${fid}&limit=7&viewer_fid=${fid}&sort_type=desc_chron`;
    
    console.log('Calling Neynar API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY,
        'accept': 'application/json'
      }
    });

    console.log('Neynar API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error response:', errorText);
      return NextResponse.json(
        { error: `Neynar API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const followersResponse = await response.json();
    console.log('Neynar API response received:', !!followersResponse);
    console.log('Response structure:', Object.keys(followersResponse));

    if (!followersResponse || !followersResponse.users) {
      console.error('Invalid response structure from Neynar API:', followersResponse);
      return NextResponse.json(
        { error: 'Invalid response structure from Neynar API' },
        { status: 500 }
      );
    }

    console.log('Number of followers found:', followersResponse.users.length);

    // Transform the response to match our expected format
    const followers = followersResponse.users.map((follower: any) => ({
      fid: follower.user.fid,
      username: follower.user.username,
      displayName: follower.user.display_name || follower.user.username,
      pfpUrl: follower.user.pfp_url || '',
      followerCount: follower.user.follower_count,
      followingCount: follower.user.following_count,
      verifiedAddresses: follower.user.verified_addresses?.eth_addresses || []
    }));

    return NextResponse.json({
      success: true,
      followers: followers,
      totalFollowers: followersResponse.users.length,
      message: `Found ${followers.length} followers for user`
    });

  } catch (error) {
    console.error('Error fetching followers:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch followers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
