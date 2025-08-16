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
    const { gameResult, userFid }: { gameResult: GameResult; userFid: number } = await request.json();

    if (!process.env.NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: 'NEYNAR_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Generate the cast text based on game result
    let castText = '';
    
    if (gameResult.gameWon) {
      // Get all followers that were bombs (avoided)
      const bombFollowers = gameResult.grid.flat()
        .filter(cell => cell.isBomb && cell.follower)
        .map(cell => cell.follower!);
      
      const followerMentions = bombFollowers
        .map(follower => `@${follower.username}`)
        .join(' ');
      
      castText = `Avoided ${followerMentions} to win 100 points! 🎉`;
    } else {
      // Game lost - mention the follower that killed the player
      if (gameResult.killedBy) {
        castText = `Got killed by @${gameResult.killedBy.username}, lost 100 points. 💥`;
      } else {
        castText = `Game over! Lost 100 points. 💥`;
      }
    }

    // Generate board image
    const imageResponse = await fetch(`${request.nextUrl.origin}/api/generate-board-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameResult })
    });

    let imageDataUrl = null;
    if (imageResponse.ok) {
      const imageResult = await imageResponse.json();
      imageDataUrl = imageResult.imageDataUrl;
    }

    // Create a simple text representation of the board for now
    // In a real implementation, you'd generate an actual image
    const boardText = gameResult.grid.map(row => 
      row.map(cell => {
        if (cell.isBomb) {
          return cell.follower ? `@${cell.follower.username}` : '💣';
        }
        return cell.isRevealed ? '✅' : '⬜';
      }).join(' ')
    ).join('\n');

    // For now, we'll just return the cast text and board representation
    // In a real implementation, you'd use the Neynar API to actually cast this
    const castData = {
      text: castText,
      boardRepresentation: boardText,
      imageDataUrl: imageDataUrl,
      gameWon: gameResult.gameWon,
      userFid: userFid
    };

    // TODO: Implement actual casting using Neynar API
    // This would require user authentication and proper casting permissions
    
    return NextResponse.json({
      success: true,
      castData,
      message: 'Cast data prepared successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to prepare cast',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
