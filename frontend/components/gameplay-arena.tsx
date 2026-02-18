'use client';

import { useState, useCallback } from 'react';
import {
  Clock,
  Bomb,
  Flag,
  Eye,
  Lock,
  Pickaxe,
} from 'lucide-react';

type CellState = 'hidden' | 'revealed' | 'flagged' | 'exploded';
type GamePhase = 'commit' | 'active' | 'waiting';

interface GameCell {
  state: CellState;
  value: number | null; // null for bombs, 0-8 for safe cells
  isMine: boolean;
}

const GRID_SIZE = 8;
const INITIAL_MINES = 10;

interface GameplayArenaProps {
  onGameEnd?: (isWinner: boolean, winAmount: number) => void;
}

export function GameplayArena({ onGameEnd }: GameplayArenaProps = {}) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('commit');
  const [secretPhrase, setSecretPhrase] = useState('');
  const [grid, setGrid] = useState<GameCell[][]>(initializeGrid());
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [playerScore, setPlayerScore] = useState(1250);
  const [opponentScore, setOpponentScore] = useState(800);
  const [flagsUsed, setFlagsUsed] = useState(3);
  const [maxFlags] = useState(10);
  const [digMode, setDigMode] = useState(true); // true = dig, false = flag
  const [revealedCount, setRevealedCount] = useState(0);

  function initializeGrid(): GameCell[][] {
    const newGrid: GameCell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            state: 'hidden' as CellState,
            value: 0,
            isMine: false,
          }))
      );

    // Randomly place mines
    let minesPlaced = 0;
    while (minesPlaced < INITIAL_MINES) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);

      if (!newGrid[row][col].isMine) {
        newGrid[row][col].isMine = true;
        newGrid[row][col].value = null;
        minesPlaced++;
      }
    }

    // Calculate numbers
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newGrid[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 &&
                newRow < GRID_SIZE &&
                newCol >= 0 &&
                newCol < GRID_SIZE &&
                newGrid[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          newGrid[row][col].value = count;
        }
      }
    }

    return newGrid;
  }

  const handleCommitSeed = () => {
    if (secretPhrase.trim()) {
      setGamePhase('active');
      setSecretPhrase('');
    }
  };

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gamePhase !== 'active') return;

      const newGrid = grid.map((r) => [...r]);
      const cell = newGrid[row][col];

      if (digMode) {
        if (cell.state === 'hidden') {
          if (cell.isMine) {
            cell.state = 'exploded';
            setGamePhase('waiting');
          } else {
            cell.state = 'revealed';
            setRevealedCount((prev) => prev + 1);
            if (cell.value === 0) {
              floodFill(newGrid, row, col);
            }
          }
        }
      } else {
        // Flag mode
        if (cell.state === 'hidden' && flagsUsed < maxFlags) {
          cell.state = 'flagged';
          setFlagsUsed((prev) => prev + 1);
        } else if (cell.state === 'flagged') {
          cell.state = 'hidden';
          setFlagsUsed((prev) => prev - 1);
        }
      }

      setGrid(newGrid);
    },
    [gamePhase, grid, digMode, flagsUsed, maxFlags]
  );

  const floodFill = (
    gridData: GameCell[][],
    row: number,
    col: number
  ) => {
    if (
      row < 0 ||
      row >= GRID_SIZE ||
      col < 0 ||
      col >= GRID_SIZE ||
      gridData[row][col].state !== 'hidden'
    ) {
      return;
    }

    gridData[row][col].state = 'revealed';
    setRevealedCount((prev) => prev + 1);

    if (gridData[row][col].value === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          floodFill(gridData, row + dr, col + dc);
        }
      }
    }
  };

  const getNumberColor = (value: number) => {
    if (value === 0) return 'text-foreground';
    if (value <= 2) return 'text-success';
    if (value <= 4) return 'text-warning';
    return 'text-error';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header HUD */}
      <div className="border-b border-border-color">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Section - Player 1 */}
          <div className="flex items-center gap-4 flex-1">
            <div className="px-3 py-1 bg-success text-background font-bold text-sm rounded-none border border-success">
              YOU
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs text-text-secondary">Score</div>
              <div className="mono font-bold text-foreground">{playerScore}</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-color rounded-none">
              <Flag size={16} className="text-warning" />
              <span className="mono text-sm font-bold text-foreground">
                {flagsUsed}/{maxFlags}
              </span>
            </div>
          </div>

          {/* Center Section - Timer */}
          <div className="flex flex-col items-center gap-2">
            <Clock size={20} className="text-foreground" />
            <div className="mono text-3xl font-bold text-foreground">
              {formatTime(timer)}
            </div>
          </div>

          {/* Right Section - Opponent */}
          <div className="flex items-center justify-end gap-4 flex-1">
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs text-text-secondary">Score</div>
              <div className="mono font-bold text-foreground">{opponentScore}</div>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-2 bg-surface border border-border-color rounded-none">
              <div className="text-xs text-text-secondary">Status</div>
              <div className="text-xs font-bold text-error animate-pulse">
                Thinking...
              </div>
            </div>
            <div className="px-3 py-1 bg-error text-background font-bold text-sm rounded-none border border-error">
              OPPONENT
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative">
          {/* Game Grid */}
          <div className="inline-block">
            <div
              className="grid gap-0.5 p-4 border border-border-color rounded-none"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                backgroundColor: '#121213',
                gap: '2px',
              }}
            >
              {grid.map((row, rowIdx) =>
                row.map((cell, colIdx) => (
                  <GameCell
                    key={`${rowIdx}-${colIdx}`}
                    cell={cell}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    numberColor={getNumberColor(cell.value || 0)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Phase Overlays */}
          {gamePhase === 'commit' && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center rounded-none border border-border-color">
              <div className="bg-surface border border-border-color px-8 py-12 max-w-sm w-full mx-4 rounded-none">
                <h2 className="text-xl font-bold text-foreground mb-6 text-center">
                  ENTER SECRET PHRASE
                </h2>
                <input
                  type="password"
                  value={secretPhrase}
                  onChange={(e) => setSecretPhrase(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleCommitSeed()
                  }
                  placeholder="••••••••"
                  className="w-full bg-background border border-border-color px-4 py-3 text-foreground placeholder-text-secondary rounded-none mb-6 mono text-center focus:outline-none focus:ring-2 focus:ring-border-color"
                />
                <button
                  onClick={handleCommitSeed}
                  className="w-full bg-success text-background font-bold py-2 rounded-none border border-success hover:opacity-90 transition-opacity"
                >
                  COMMIT SEED
                </button>
                <div className="mt-6 text-center flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <p className="text-sm text-text-secondary">
                    Waiting for Opponent...
                  </p>
                </div>
              </div>
            </div>
          )}

          {gamePhase === 'waiting' && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-none border border-border-color">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-border-color border-t-foreground rounded-full animate-spin mx-auto mb-4" />
                <p className="text-foreground font-bold text-lg">
                  OPPONENT IS MOVING...
                </p>
                <p className="text-text-secondary text-sm mt-2">SYNCING STATE</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Mode Toggle - Only visible during active game */}
      {gamePhase === 'active' && (
        <div className="border-t border-border-color px-6 py-4 flex items-center justify-center gap-2 md:hidden">
          <button
            onClick={() => setDigMode(true)}
            className={`px-4 py-2 rounded-none border font-bold transition-colors ${
              digMode
                ? 'bg-success text-background border-success'
                : 'bg-surface text-foreground border-border-color'
            }`}
          >
            <Pickaxe className="w-4 h-4" /> DIG
          </button>
          <button
            onClick={() => setDigMode(false)}
            className={`px-4 py-2 rounded-none border font-bold transition-colors ${
              !digMode
                ? 'bg-warning text-background border-warning'
                : 'bg-surface text-foreground border-border-color'
            }`}
          >
            <Flag className="w-4 h-4" /> FLAG
          </button>
        </div>
      )}
    </div>
  );
}

interface GameCellProps {
  cell: GameCell;
  onClick: () => void;
  numberColor: string;
}

function GameCell({ cell, onClick, numberColor }: GameCellProps) {
  const getBackgroundColor = () => {
    switch (cell.state) {
      case 'hidden':
        return 'bg-border-color hover:brightness-110 cursor-pointer';
      case 'revealed':
        return 'bg-background';
      case 'flagged':
        return 'bg-border-color';
      case 'exploded':
        return 'bg-error';
      default:
        return 'bg-border-color';
    }
  };

  const getContent = () => {
    if (cell.state === 'flagged') {
      return <Flag size={16} className="text-warning" />;
    }
    if (cell.state === 'exploded') {
      return <Bomb size={16} className="text-background" />;
    }
    if (cell.state === 'revealed' && cell.value !== null && cell.value > 0) {
      return (
        <span className={`font-bold text-sm mono ${numberColor}`}>
          {cell.value}
        </span>
      );
    }
    return null;
  };

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-none border transition-all hover:brightness-125 ${getBackgroundColor()}`}
      style={{
        borderWidth: '1px',
        borderColor: '#3A3A3C',
      }}
    >
      {getContent()}
    </button>
  );
}
