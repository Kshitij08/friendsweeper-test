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

    const boardSize = 8;
    const cellSize = 40;
    const canvasWidth = boardSize * cellSize + 40; // Add padding
    const canvasHeight = boardSize * cellSize + 80; // Add padding for title
    
    // Create a simple SVG representation of the board
    let svgContent = `
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .cell { fill: #4a5568; stroke: #2d3748; stroke-width: 1; }
            .revealed { fill: #e2e8f0; }
            .bomb { fill: #e53e3e; }
            .flag { fill: #f56565; }
            .text { font-family: Arial, sans-serif; font-size: 12px; fill: #2d3748; text-anchor: middle; }
            .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #ffffff; text-anchor: middle; }
            .username { font-family: Arial, sans-serif; font-size: 8px; fill: #ffffff; text-anchor: middle; }
          </style>
        </defs>
        <rect width="${canvasWidth}" height="${canvasHeight}" fill="#1a202c"/>
        <text x="${canvasWidth/2}" y="25" class="title">
          ${gameResult.gameWon ? '🎉 You Won!' : '💥 Game Over!'}
        </text>
    `;

         // Generate board cells
     for (let row = 0; row < boardSize; row++) {
       for (let col = 0; col < boardSize; col++) {
         const cell = enhancedGrid[row][col];
        const x = col * cellSize + 20;
        const y = row * cellSize + 40;
        
        let cellClass = 'cell';
        let cellContent = '';
        
        if (cell.isBomb) {
          cellClass += ' bomb';
          if (cell.follower && cell.follower.pfpUrl) {
            // Add profile image
            cellContent = `
              <defs>
                <clipPath id="circle-${row}-${col}">
                  <circle cx="${x + cellSize/2}" cy="${y + cellSize/2}" r="${(cellSize-4)/2}"/>
                </clipPath>
              </defs>
              <image 
                href="${cell.follower.pfpUrl}" 
                x="${x + 2}" 
                y="${y + 2}" 
                width="${cellSize-4}" 
                height="${cellSize-4}"
                clip-path="url(#circle-${row}-${col})"
              />
              <text x="${x + cellSize/2}" y="${y + cellSize + 8}" class="username">@${cell.follower.username}</text>
            `;
          } else {
            cellContent = `<text x="${x + cellSize/2}" y="${y + cellSize/2 + 4}" class="text">💣</text>`;
          }
        } else if (cell.isRevealed) {
          cellClass += ' revealed';
          if (cell.neighborBombs > 0) {
            cellContent = `<text x="${x + cellSize/2}" y="${y + cellSize/2 + 4}" class="text">${cell.neighborBombs}</text>`;
          }
        } else if (cell.isFlagged) {
          cellClass += ' flag';
          cellContent = `<text x="${x + cellSize/2}" y="${y + cellSize/2 + 4}" class="text">🚩</text>`;
        }
        
        svgContent += `
          <rect x="${x}" y="${y}" width="${cellSize-2}" height="${cellSize-2}" class="${cellClass}"/>
          ${cellContent}
        `;
      }
    }
    
    svgContent += '</svg>';
    
    // Convert SVG to data URL for preview
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // Generate a unique ID for the image
    const imageId = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the SVG in our cache
    const storeResponse = await fetch(`${request.nextUrl.origin}/api/board-image/${imageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ svg: svgContent })
    });
    
    let publicUrl = dataUrl; // fallback
    if (storeResponse.ok) {
      publicUrl = `${request.nextUrl.origin}/api/board-image/${imageId}`;
    }
    
    return NextResponse.json({
      success: true,
      imageDataUrl: dataUrl,
      publicUrl: publicUrl,
      message: 'Board image generated successfully'
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
