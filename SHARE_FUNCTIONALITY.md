# Share Functionality Implementation

## Overview

The Friendsweeper game now includes a share functionality that allows players to cast their game results to Farcaster with a visual representation of their board layout.

## Features

### 1. Share Button
- Added to both Game Over and Win modals
- Opens a preview modal before sharing
- Shows cast text and board layout image

### 2. Cast Text Generation
- **Win**: "Avoided @username1 @username2 @username3... to win 100 points! 🎉"
- **Loss**: "Got killed by @username, lost 100 points. 💥"

### 3. Board Image Generation
- Creates an SVG representation of the game board
- Shows revealed cells, bombs, and flags
- Displays follower usernames on bomb cells
- Includes game result title (Win/Loss)

## Implementation Details

### API Routes

#### `/api/cast-game-result`
- Accepts game result data
- Generates appropriate cast text based on win/loss
- Calls image generation API
- Returns prepared cast data

#### `/api/generate-board-image`
- Creates SVG representation of the board
- Uses Canvas-like styling for visual appeal
- Returns base64 encoded image data URL

### Components

#### `ShareResultModal`
- Displays cast preview with text and image
- Integrates with Farcaster SDK for actual casting
- Handles loading states and error handling

#### Updated `Minesweeper`
- Added share button to game over and win modals
- Integrated with ShareResultModal component
- Manages share state and modal visibility

## Usage

1. **Game Over**: When player loses, click "Share Result" button
2. **Win**: When player wins, click "Share Result" button
3. **Preview**: Review cast text and board image in modal
4. **Share**: Click "Share to Farcaster" to cast the result

## Technical Notes

### Farcaster Integration
- Uses existing Farcaster SDK actions
- `composeCast` method for posting
- Supports text and image embeds

### Image Generation
- Server-side SVG generation
- Responsive design for different screen sizes
- Base64 encoding for easy embedding

### Error Handling
- Graceful fallback if image generation fails
- User-friendly error messages
- Loading states for better UX

## Future Enhancements

1. **Real Image Generation**: Replace SVG with actual PNG/JPG images
2. **User Authentication**: Get real user FID instead of mock value
3. **Score Tracking**: Integrate with actual scoring system
4. **Social Features**: Add reactions and comments
5. **Leaderboards**: Share scores and rankings

## Dependencies

- Farcaster SDK for casting
- Next.js API routes for backend logic
- React state management for UI
- Tailwind CSS for styling
