interface Follower {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses: string[];
}

interface CachedFollowers {
  followers: Follower[];
  timestamp: number;
  userFid: string;
}

// In-memory cache for follower data
// In production, you'd use Redis or a database
const followerCache = new Map<string, CachedFollowers>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function cacheFollowers(userFid: string, followers: Follower[]): void {
  followerCache.set(userFid, {
    followers,
    timestamp: Date.now(),
    userFid
  });
}

export function getCachedFollowers(userFid: string): Follower[] | null {
  const cached = followerCache.get(userFid);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    followerCache.delete(userFid);
    return null;
  }
  
  return cached.followers;
}

export function clearCache(userFid?: string): void {
  if (userFid) {
    followerCache.delete(userFid);
  } else {
    followerCache.clear();
  }
}

export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: followerCache.size,
    entries: Array.from(followerCache.keys())
  };
}
