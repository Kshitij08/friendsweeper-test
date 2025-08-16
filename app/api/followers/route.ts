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

    // Default FIDs to use as fallback
    const defaultFids = [4753, 3, 12, 99, 1075899, 1350, 2233, 1188544];
    
    // Fetch more followers to have a larger pool for random selection
    const apiUrl = `https://api.neynar.com/v2/farcaster/followers/?fid=${fid}&limit=20&viewer_fid=${fid}&sort_type=desc_chron`;
    
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
    const userFollowers = followersResponse.users.map((follower: any) => ({
      fid: follower.user.fid,
      username: follower.user.username,
      displayName: follower.user.display_name || follower.user.username,
      pfpUrl: follower.user.pfp_url || '',
      followerCount: follower.user.follower_count,
      followingCount: follower.user.following_count,
      verifiedAddresses: follower.user.verified_addresses?.eth_addresses || []
    }));

    console.log('User followers FIDs:', userFollowers.map((f: any) => f.fid));

    // Randomly select up to 8 followers from the user's followers
    const shuffledFollowers = [...userFollowers].sort(() => Math.random() - 0.5);
    const selectedFollowers = shuffledFollowers.slice(0, Math.min(8, userFollowers.length));
    
    console.log('Selected followers FIDs:', selectedFollowers.map((f: any) => f.fid));
    console.log('Number of selected followers:', selectedFollowers.length);

    // If we have less than 8 followers, fill with random default FIDs
    const remainingSlots = 8 - selectedFollowers.length;
    let finalFollowers = [...selectedFollowers];

    if (remainingSlots > 0) {
      console.log(`User has ${userFollowers.length} followers, filling ${remainingSlots} slots with default FIDs`);
      
      // Shuffle default FIDs and take what we need
      const shuffledDefaults = [...defaultFids].sort(() => Math.random() - 0.5);
      const selectedDefaults = shuffledDefaults.slice(0, remainingSlots);
      
      console.log('Selected default FIDs:', selectedDefaults);
      
      // Fetch details for selected default FIDs
      const defaultFollowersPromises = selectedDefaults.map(async (defaultFid) => {
        try {
          const userApiUrl = `https://api.neynar.com/v2/farcaster/user/?fid=${defaultFid}&viewer_fid=${fid}`;
          const userResponse = await fetch(userApiUrl, {
            headers: {
              'x-api-key': process.env.NEYNAR_API_KEY!,
              'accept': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            return {
              fid: userData.user.fid,
              username: userData.user.username,
              displayName: userData.user.display_name || userData.user.username,
              pfpUrl: userData.user.pfp_url || '',
              followerCount: userData.user.follower_count,
              followingCount: userData.user.following_count,
              verifiedAddresses: userData.user.verified_addresses?.eth_addresses || []
            };
          } else {
            // Fallback if API call fails
            return {
              fid: defaultFid,
              username: `user${defaultFid}`,
              displayName: `User ${defaultFid}`,
              pfpUrl: '',
              followerCount: 0,
              followingCount: 0,
              verifiedAddresses: []
            };
          }
        } catch (error) {
          console.error(`Error fetching default FID ${defaultFid}:`, error);
          // Fallback if API call fails
          return {
            fid: defaultFid,
            username: `user${defaultFid}`,
            displayName: `User ${defaultFid}`,
            pfpUrl: '',
            followerCount: 0,
            followingCount: 0,
            verifiedAddresses: []
          };
        }
      });
      
      const defaultFollowers = await Promise.all(defaultFollowersPromises);
      finalFollowers = [...selectedFollowers, ...defaultFollowers];
    }

    // Shuffle the final list one more time to mix user followers and defaults
    finalFollowers = finalFollowers.sort(() => Math.random() - 0.5);
    
    console.log('Final followers FIDs:', finalFollowers.map((f: any) => f.fid));
    console.log('Total final followers:', finalFollowers.length);

    return NextResponse.json({
      success: true,
      followers: finalFollowers,
      totalFollowers: finalFollowers.length,
      message: `Selected ${selectedFollowers.length} random followers and ${remainingSlots > 0 ? `filled ${remainingSlots} slots with defaults` : 'used all user followers'}`
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
