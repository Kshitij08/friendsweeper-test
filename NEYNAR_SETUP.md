# Neynar Integration Setup

This project now includes Neynar integration to fetch the top 5 followers of any Farcaster user by their FID.

## Setup Instructions

### 1. Get a Neynar API Key

1. Go to [Neynar](https://neynar.com/)
2. Sign up for an account
3. Navigate to the API section
4. Generate a new API key

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Neynar API Key - Get from https://neynar.com/
NEYNAR_API_KEY=your_neynar_api_key_here

# Next.js Public URL (for development, use cloudflared or ngrok URL)
NEXT_PUBLIC_URL=https://your-app-url.com
```

### 3. Features

The integration provides:

- **Follower Search**: Enter any FID to see the top 5 followers
- **User Details**: Display name, username, profile picture, follower/following counts
- **Verification Status**: Shows verified addresses with a checkmark
- **Responsive Design**: Works on both desktop and mobile
- **Error Handling**: Graceful error handling for invalid FIDs or API issues

### 4. Usage

1. Start the development server: `pnpm dev`
2. Navigate to the app
3. Click "View Followers" button
4. Enter a FID (e.g., 194 for Dwr)
5. Click "Search" to see the top 5 followers

### 5. API Endpoint

The integration creates a new API endpoint at `/api/followers` that accepts a `fid` query parameter:

```
GET /api/followers?fid=194
```

Response format:
```json
{
  "success": true,
  "followers": [
    {
      "fid": 123,
      "username": "user123",
      "displayName": "User Name",
      "pfpUrl": "https://...",
      "followerCount": 1000,
      "followingCount": 500,
      "verifiedAddresses": ["0x..."]
    }
  ],
  "totalFollowers": 5
}
```

### 6. Troubleshooting

- **API Key Error**: Make sure your `NEYNAR_API_KEY` is set correctly in `.env.local`
- **Invalid FID**: Ensure the FID is a valid number
- **No Followers**: Some users may not have followers or the API may not return results
- **Rate Limiting**: Neynar has rate limits, so avoid making too many requests quickly
