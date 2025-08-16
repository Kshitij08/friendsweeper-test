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
  const [longPressCompleted, setLongPressCompleted] = useState(false)
  const [mouseDownTimer, setMouseDownTimer] = useState<NodeJS.Timeout | null>(null)
  const [mouseDownRow, setMouseDownRow] = useState<number | null>(null)
  const [mouseDownCol, setMouseDownCol] = useState<number | null>(null)
  const [lastTapTime, setLastTapTime] = useState<number>(0)
  const [lastTapRow, setLastTapRow] = useState<number | null>(null)
  const [lastTapCol, setLastTapCol] = useState<number | null>(null)
  const [touchUsed, setTouchUsed] = useState(false)

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

  // Handle cell reveal action
  const handleCellReveal = (row: number, col: number) => {
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

  // Handle cell click (desktop only)
  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameOver || gameState.gameWon) return

    // Prevent click if touch events were used (mobile)
    if (touchUsed) {
      return
    }

    // Prevent click if this was a long press
    if (wasLongPress(row, col)) {
      setLongPressCompleted(false)
      return
    }

    // Check for double tap
    const currentTime = Date.now()
    const timeDiff = currentTime - lastTapTime
    const isDoubleTap = timeDiff < 300 && lastTapRow === row && lastTapCol === col

    if (isDoubleTap) {
      // Double tap detected - flag the cell
      flagCell(row, col)
      setLastTapTime(0)
      setLastTapRow(null)
      setLastTapCol(null)
      return
    }

    // Single tap - update last tap info
    setLastTapTime(currentTime)
    setLastTapRow(row)
    setLastTapCol(col)

    // Handle single tap reveal
    handleCellReveal(row, col)
  }

  // Handle right click (flag)
  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    flagCell(row, col)
  }

  // Handle long press (flag) for mobile
  const handleLongPress = (row: number, col: number) => {
    flagCell(row, col)
    setLongPressCompleted(true)
  }

  // Handle touch start for long press detection
  const handleTouchStart = (row: number, col: number) => {
    setTouchUsed(true)
    setLongPressCompleted(false)
    const timer = setTimeout(() => {
      handleLongPress(row, col)
    }, 500) // 500ms long press threshold
    
    setLongPressTimer(timer)
    setLongPressRow(row)
    setLongPressCol(col)
  }

  // Handle touch end to cancel long press
  const handleTouchEnd = (row: number, col: number) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressRow(null)
    setLongPressCol(null)
    
    // Check for double tap on touch end
    const currentTime = Date.now()
    const timeDiff = currentTime - lastTapTime
    const isDoubleTap = timeDiff < 300 && lastTapRow === row && lastTapCol === col

    if (isDoubleTap) {
      // Double tap detected - flag the cell
      flagCell(row, col)
      setLastTapTime(0)
      setLastTapRow(null)
      setLastTapCol(null)
      setTouchUsed(false)
      return
    }

    // Single tap - update last tap info and reveal cell
    setLastTapTime(currentTime)
    setLastTapRow(row)
    setLastTapCol(col)
    
    // Handle single tap reveal
    handleCellReveal(row, col)
    
    // Reset touch flag after a short delay
    setTimeout(() => {
      setTouchUsed(false)
    }, 100)
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

  // Handle mouse down for desktop long press
  const handleMouseDown = (row: number, col: number) => {
    setLongPressCompleted(false)
    const timer = setTimeout(() => {
      handleLongPress(row, col)
    }, 500) // 500ms long press threshold
    
    setMouseDownTimer(timer)
    setMouseDownRow(row)
    setMouseDownCol(col)
  }

  // Handle mouse up to cancel desktop long press
  const handleMouseUp = () => {
    if (mouseDownTimer) {
      clearTimeout(mouseDownTimer)
      setMouseDownTimer(null)
    }
    setMouseDownRow(null)
    setMouseDownCol(null)
  }

  // Handle mouse leave to cancel desktop long press
  const handleMouseLeave = () => {
    if (mouseDownTimer) {
      clearTimeout(mouseDownTimer)
      setMouseDownTimer(null)
    }
    setMouseDownRow(null)
    setMouseDownCol(null)
  }

  // Check if a long press was detected for a specific cell
  const wasLongPress = (row: number, col: number) => {
    return longPressCompleted && ((longPressRow === row && longPressCol === col) || (mouseDownRow === row && mouseDownCol === col))
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
      if (mouseDownTimer) {
        clearTimeout(mouseDownTimer)
      }
    }
  }, [longPressTimer, mouseDownTimer])

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
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full object-cover"
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
      <div className="text-center mb-8">
        {followers.length > 0 && (
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 mb-6 border border-purple-500/30">
            <p className="text-gray-200 font-medium">
              Your top {followers.length} followers are hidden as bombs! 💣
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-lg font-semibold text-gray-200">
              Bombs: {gameState.bombsRemaining}
            </span>
          </div>
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            New Game
          </button>
        </div>
        
        {gameState.gameOver && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 animate-pulse">
            <div className="text-red-400 text-xl font-bold flex items-center justify-center space-x-2">
              <span>💥</span>
              <span>Game Over!</span>
              <span>💥</span>
            </div>
          </div>
        )}
        
        {gameState.gameWon && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 animate-pulse">
            <div className="text-green-400 text-xl font-bold flex items-center justify-center space-x-2">
              <span>🎉</span>
              <span>You Won!</span>
              <span>🎉</span>
            </div>
          </div>
        )}
      </div>

                   <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="flex flex-col gap-1 sm:gap-2">
          {gameState.grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 sm:gap-2 justify-center">
              {row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                  onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
                  onTouchEnd={() => handleTouchEnd(rowIndex, colIndex)}
                  onTouchMove={handleTouchMove}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                    flex items-center justify-center text-xs sm:text-sm md:text-base font-bold rounded-lg
                    ${cell.isRevealed ? 'bg-gray-200 shadow-inner' : 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 shadow-lg hover:shadow-xl'}
                    ${getCellColor(cell)}
                    transition-all duration-200
                    touch-manipulation
                    transform hover:scale-105
                    flex-shrink-0
                    select-none
                  `}
                  disabled={gameState.gameOver || gameState.gameWon}
                >
                  {getCellContent(cell)}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

             <div className="text-center mt-8">
         <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
           <p className="text-gray-300 text-sm font-medium">
             💡 Tap to reveal • Double tap, long press, or right-click to flag
           </p>
         </div>
       </div>

             {/* Game Over Modal */}
       {showGameOverModal && gameState.killedBy && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md mx-4 border border-gray-700 shadow-2xl">
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
                 className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg px-8 py-3 font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}

             {/* Win Modal */}
       {showWinModal && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md mx-4 max-h-96 overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-white mb-4">You Survived!</h3>
              <p className="text-gray-300 mb-4">You avoided all your followers:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                                 {getBombFollowers().map((follower, index) => (
                   <div key={follower.fid} className="flex items-center space-x-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-3 border border-gray-600/50 hover:from-gray-600 hover:to-gray-700 transition-all duration-200">
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
                 className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg px-8 py-3 font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-lg mt-4"
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
