'use client'

import { useState, useEffect } from 'react'

interface Follower {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  followerCount: number
  followingCount: number
  verifiedAddresses: string[]
}

interface Cell {
  isBomb: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborBombs: number
  follower?: Follower
}

interface GameState {
  grid: Cell[][]
  gameOver: boolean
  gameWon: boolean
  bombsRemaining: number
  killedBy?: Follower
}

interface MinesweeperProps {
  followers?: Follower[]
}

export function Minesweeper({ followers = [] }: MinesweeperProps) {
  const GRID_SIZE = 8
  const BOMB_COUNT = 8

  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    gameOver: false,
    gameWon: false,
    bombsRemaining: BOMB_COUNT
  })

  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [showWinModal, setShowWinModal] = useState(false)

  const [firstClick, setFirstClick] = useState(true)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [longPressRow, setLongPressRow] = useState<number | null>(null)
  const [longPressCol, setLongPressCol] = useState<number | null>(null)

  // Initialize the game grid
  const initializeGrid = (): Cell[][] => {
    const grid: Cell[][] = []
    for (let i = 0; i < GRID_SIZE; i++) {
      grid[i] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        grid[i][j] = {
          isBomb: false,
          isRevealed: false,
          isFlagged: false,
          neighborBombs: 0
        }
      }
    }
    return grid
  }

  // Place bombs randomly
  const placeBombs = (grid: Cell[][], firstRow: number, firstCol: number): Cell[][] => {
    const newGrid = [...grid]
    let bombsPlaced = 0

    while (bombsPlaced < BOMB_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)

      // Don't place bomb on first click or if already a bomb
      if (!newGrid[row][col].isBomb && (row !== firstRow || col !== firstCol)) {
        newGrid[row][col].isBomb = true
        // Assign a follower to this bomb if available
        if (bombsPlaced < followers.length) {
          newGrid[row][col].follower = followers[bombsPlaced]
        }
        bombsPlaced++
      }
    }

    // Calculate neighbor bombs for each cell
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!newGrid[i][j].isBomb) {
          newGrid[i][j].neighborBombs = countNeighborBombs(newGrid, i, j)
        }
      }
    }

    return newGrid
  }

  // Count bombs in neighboring cells
  const countNeighborBombs = (grid: Cell[][], row: number, col: number): number => {
    let count = 0
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i
        const newCol = col + j
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
          if (grid[newRow][newCol].isBomb) {
            count++
          }
        }
      }
    }
    return count
  }

  // Reveal cell and its neighbors
  const revealCell = (grid: Cell[][], row: number, col: number): Cell[][] => {
    let newGrid = [...grid]
    
    if (newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) {
      return newGrid
    }

    newGrid[row][col].isRevealed = true

    // If cell has no neighbor bombs, reveal neighbors
    if (newGrid[row][col].neighborBombs === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const newRow = row + i
          const newCol = col + j
          if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            if (!newGrid[newRow][newCol].isRevealed && !newGrid[newRow][newCol].isFlagged) {
              newGrid = revealCell(newGrid, newRow, newCol)
            }
          }
        }
      }
    }

    return newGrid
  }

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameOver || gameState.gameWon) return

    let newGrid = [...gameState.grid]

    if (firstClick) {
      newGrid = placeBombs(newGrid, row, col)
      setFirstClick(false)
    }

    if (newGrid[row][col].isBomb) {
      // Game over - reveal all bombs
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (newGrid[i][j].isBomb) {
            newGrid[i][j].isRevealed = true
          }
        }
      }
      setGameState({
        ...gameState,
        grid: newGrid,
        gameOver: true,
        killedBy: newGrid[row][col].follower
      })
      setShowGameOverModal(true)
    } else {
      newGrid = revealCell(newGrid, row, col)
      
      // Check if game is won
      const revealedCount = newGrid.flat().filter(cell => cell.isRevealed).length
      const totalCells = GRID_SIZE * GRID_SIZE
      const gameWon = revealedCount === totalCells - BOMB_COUNT

      setGameState({
        ...gameState,
        grid: newGrid,
        gameWon
      })
      
      if (gameWon) {
        setShowWinModal(true)
      }
    }
  }

  // Handle right click (flag)
  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    flagCell(row, col)
  }

  // Handle long press (flag) for mobile
  const handleLongPress = (row: number, col: number) => {
    flagCell(row, col)
  }

  // Handle touch start for long press detection
  const handleTouchStart = (row: number, col: number) => {
    const timer = setTimeout(() => {
      handleLongPress(row, col)
    }, 500) // 500ms long press threshold
    
    setLongPressTimer(timer)
    setLongPressRow(row)
    setLongPressCol(col)
  }

  // Handle touch end to cancel long press
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressRow(null)
    setLongPressCol(null)
  }

  // Handle touch move to cancel long press if finger moves
  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressRow(null)
    setLongPressCol(null)
  }

  // Flag/unflag a cell
  const flagCell = (row: number, col: number) => {
    if (gameState.gameOver || gameState.gameWon || gameState.grid[row][col].isRevealed) return

    const newGrid = [...gameState.grid]
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged

    const bombsRemaining = BOMB_COUNT - newGrid.flat().filter(cell => cell.isFlagged).length

    setGameState({
      ...gameState,
      grid: newGrid,
      bombsRemaining
    })
  }

  // Reset game
  const resetGame = () => {
    setGameState({
      grid: initializeGrid(),
      gameOver: false,
      gameWon: false,
      bombsRemaining: BOMB_COUNT
    })
    setFirstClick(true)
    setShowGameOverModal(false)
    setShowWinModal(false)
  }

  // Initialize grid on component mount
  useEffect(() => {
    setGameState({
      grid: initializeGrid(),
      gameOver: false,
      gameWon: false,
      bombsRemaining: BOMB_COUNT
    })
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  const getCellContent = (cell: Cell) => {
    if (!cell.isRevealed) {
      return cell.isFlagged ? '🚩' : ''
    }
    if (cell.isBomb) {
      if (cell.follower?.pfpUrl) {
        return (
          <img
            src={cell.follower.pfpUrl}
            alt={cell.follower.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        )
      }
      return '💣'
    }
    if (cell.neighborBombs === 0) {
      return ''
    }
    return cell.neighborBombs.toString()
  }

  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) {
      return 'bg-gray-600 hover:bg-gray-500'
    }
    if (cell.isBomb) {
      return 'bg-red-500'
    }
    const colors = [
      'bg-gray-200', // 0
      'text-blue-600', // 1
      'text-green-600', // 2
      'text-red-600', // 3
      'text-purple-600', // 4
      'text-yellow-600', // 5
      'text-cyan-600', // 6
      'text-black', // 7
      'text-gray-600' // 8
    ]
    return cell.neighborBombs === 0 ? 'bg-gray-200' : colors[cell.neighborBombs]
  }

  // Get all followers that were bombs
  const getBombFollowers = () => {
    const bombFollowers: Follower[] = []
    gameState.grid.forEach(row => {
      row.forEach(cell => {
        if (cell.isBomb && cell.follower) {
          bombFollowers.push(cell.follower)
        }
      })
    })
    return bombFollowers
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="text-center mb-6">
        {followers.length > 0 && (
          <p className="text-gray-300 mb-4">
            Your top {followers.length} followers are hidden as bombs! 💣
          </p>
        )}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">
            Bombs: {gameState.bombsRemaining}
          </div>
          <button
            onClick={resetGame}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            New Game
          </button>
        </div>
        
        {gameState.gameOver && (
          <div className="text-red-500 text-xl font-bold mb-4">
            Game Over! 💥
          </div>
        )}
        
        {gameState.gameWon && (
          <div className="text-green-500 text-xl font-bold mb-4">
            You Won! 🎉
          </div>
        )}
      </div>

             <div className="grid grid-cols-8 gap-3 bg-gray-800 p-6 rounded-lg">
        {gameState.grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
                         <button
               key={`${rowIndex}-${colIndex}`}
               onClick={() => handleCellClick(rowIndex, colIndex)}
               onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
               onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
               onTouchEnd={handleTouchEnd}
               onTouchMove={handleTouchMove}
                                                               className={`
                   w-12 h-12 flex items-center justify-center text-sm font-bold rounded
                   ${cell.isRevealed ? 'bg-gray-200' : 'bg-gray-600 hover:bg-gray-500'}
                   ${getCellColor(cell)}
                   transition-colors
                   touch-manipulation
                 `}
               disabled={gameState.gameOver || gameState.gameWon}
             >
               {getCellContent(cell)}
             </button>
          ))
        )}
      </div>

                          <div className="text-center mt-6 text-sm text-gray-300">
          <p>Tap to reveal • Long press or right-click to flag</p>
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOverModal && gameState.killedBy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">💥</div>
              <h3 className="text-xl font-bold text-white mb-2">Game Over!</h3>
              <div className="flex items-center justify-center space-x-3 mb-4">
                {gameState.killedBy.pfpUrl ? (
                  <img
                    src={gameState.killedBy.pfpUrl}
                    alt={gameState.killedBy.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-gray-400 text-lg">
                      {gameState.killedBy.displayName?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <p className="text-white font-semibold">
                    Killed by {gameState.killedBy.displayName}
                  </p>
                  <p className="text-gray-400 text-sm">@{gameState.killedBy.username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowGameOverModal(false)}
                className="bg-red-600 text-white rounded-md px-6 py-2 font-medium hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 max-h-96 overflow-y-auto">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-white mb-4">You Survived!</h3>
              <p className="text-gray-300 mb-4">You avoided all your followers:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getBombFollowers().map((follower, index) => (
                  <div key={follower.fid} className="flex items-center space-x-3 bg-gray-700 rounded-lg p-2">
                    {follower.pfpUrl ? (
                      <img
                        src={follower.pfpUrl}
                        alt={follower.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          {follower.displayName?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <p className="text-white text-sm font-semibold">
                        {follower.displayName}
                      </p>
                      <p className="text-gray-400 text-xs">@{follower.username}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowWinModal(false)}
                className="bg-green-600 text-white rounded-md px-6 py-2 font-medium hover:bg-green-700 transition-colors mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
