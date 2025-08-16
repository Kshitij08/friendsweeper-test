import { NextRequest, NextResponse } from 'next/server';

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
    const { gameResult }: { gameResult: GameResult } = await request.json();

    // For now, we'll return a data URL representation
    // In a real implementation, you'd use a server-side image generation library
    // like Canvas, Sharp, or a cloud service like Cloudinary
    
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
        const cell = gameResult.grid[row][col];
        const x = col * cellSize + 20;
        const y = row * cellSize + 40;
        
        let cellClass = 'cell';
        let cellText = '';
        
        if (cell.isBomb) {
          cellClass += ' bomb';
          cellText = cell.follower ? `@${cell.follower.username}` : '💣';
        } else if (cell.isRevealed) {
          cellClass += ' revealed';
          if (cell.neighborBombs > 0) {
            cellText = cell.neighborBombs.toString();
          }
        } else if (cell.isFlagged) {
          cellClass += ' flag';
          cellText = '🚩';
        }
        
        svgContent += `
          <rect x="${x}" y="${y}" width="${cellSize-2}" height="${cellSize-2}" class="${cellClass}"/>
          <text x="${x + cellSize/2}" y="${y + cellSize/2 + 4}" class="text">${cellText}</text>
        `;
      }
    }
    
    svgContent += '</svg>';
    
    // Convert SVG to data URL
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    return NextResponse.json({
      success: true,
      imageDataUrl: dataUrl,
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
