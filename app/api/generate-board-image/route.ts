import { NextRequest, NextResponse } from 'next/server';
import { getCachedFollowers } from '@/lib/follower-cache';

interface Follower {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses: string[];
}

interface Cell {
  isBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborBombs: number;
  follower?: Follower;
}

interface GameResult {
  gameWon: boolean;
  grid: Cell[][];
  killedBy?: Follower;
  followers: Follower[];
}

export async function POST(request: NextRequest) {
  try {
    const { gameResult, userFid }: { gameResult: GameResult; userFid?: string } = await request.json();

    // Get cached followers if available
    let cachedFollowers: Follower[] = [];
    if (userFid) {
      cachedFollowers = getCachedFollowers(userFid) || [];
    }

    // Enhance the grid with cached follower data for better profile images
    const enhancedGrid = gameResult.grid.map(row => 
      row.map(cell => {
        if (cell.isBomb && cell.follower) {
          // Try to find better profile image from cache
          const cachedFollower = cachedFollowers.find(f => f.fid === cell.follower!.fid);
          if (cachedFollower && cachedFollower.pfpUrl) {
            return {
              ...cell,
              follower: {
                ...cell.follower,
                pfpUrl: cachedFollower.pfpUrl,
                username: cachedFollower.username,
                displayName: cachedFollower.displayName
              }
            };
          }
        }
        return cell;
      })
    );

    // Create a simple text-based board representation
    const boardSize = 8;
    let boardText = `${gameResult.gameWon ? '🎉 You Won!' : '💥 Game Over!'}\n\n`;
    
    // Add board representation
    for (let row = 0; row < boardSize; row++) {
      let rowText = '';
      for (let col = 0; col < boardSize; col++) {
        const cell = enhancedGrid[row][col];
        
        if (cell.isBomb) {
          if (cell.follower) {
            // Use first letter of username
            rowText += cell.follower.username.charAt(0).toUpperCase();
          } else {
            rowText += '💣';
          }
        } else if (cell.isRevealed) {
          if (cell.neighborBombs > 0) {
            rowText += cell.neighborBombs.toString();
          } else {
            rowText += ' ';
          }
        } else if (cell.isFlagged) {
          rowText += '🚩';
        } else {
          rowText += '⬜';
        }
        rowText += ' ';
      }
      boardText += rowText.trim() + '\n';
    }
    
    // Add follower information
    const bombFollowers = enhancedGrid.flat()
      .filter(cell => cell.isBomb && cell.follower)
      .map(cell => cell.follower!);
    
    if (bombFollowers.length > 0) {
      boardText += '\nBombs: ';
      boardText += bombFollowers.map(f => `@${f.username}`).join(', ');
    }

    // Create a simple SVG that represents the text
    const lines = boardText.split('\n');
    let svgTextElements = '';
    let y = 80;
    
    for (const line of lines) {
      if (line.trim()) {
        svgTextElements += `<text x="50" y="${y}" class="board">${line}</text>`;
        y += 20;
      }
    }
    
    const svgContent = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .text { font-family: monospace; font-size: 14px; fill: #ffffff; }
            .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #ffffff; text-anchor: middle; }
            .board { font-family: monospace; font-size: 16px; fill: #ffffff; }
          </style>
        </defs>
        <rect width="600" height="400" fill="#1a202c"/>
        <text x="300" y="40" class="title">${gameResult.gameWon ? '🎉 You Won!' : '💥 Game Over!'}</text>
        ${svgTextElements}
      </svg>
    `;
    
    // Convert SVG to data URL for preview
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // For now, we'll return the data URL directly
    // In production, you'd convert this to a PNG/JPG using a service like Puppeteer or Cloudinary
    return NextResponse.json({
      success: true,
      imageDataUrl: dataUrl,
      publicUrl: dataUrl, // Use data URL for now
      message: 'Board image generated successfully (text-based)'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to generate board image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
