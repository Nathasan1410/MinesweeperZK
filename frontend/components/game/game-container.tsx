/**
 * Game Container Component
 * Main game container that combines HUD and board
 */

'use client';

import { Trophy, Zap, Gamepad2 } from 'lucide-react';
import { useMinesweeperGame } from '@/hooks/use-minesweeper-game';
import { GameBoard, CompactGameBoard } from './game-board';
import { GameHUD, CompactGameHUD } from './game-hud';
import { Notification } from './notification';
import { GAME_CONFIG, THEME_COLORS } from '@/lib/game/types';

interface GameContainerProps {
  compact?: boolean;
}

export function GameContainer({ compact = false }: GameContainerProps) {
  const {
    phase,
    notification,
    isGameOver,
    isWinner,
    score,
    playerMoves,
    formattedTime,
    startGame,
    resetGame,
  } = useMinesweeperGame();

  // Show lobby screen if not started
  if (phase === 'lobby') {
    return <LobbyScreen onStart={startGame} />;
  }

  // Show summary screen if game over
  if (phase === 'summary') {
    return (
      <SummaryScreen
        isWinner={isWinner}
        score={score}
        moves={playerMoves.length}
        time={formattedTime}
        onPlayAgain={startGame}
        onBackToLobby={resetGame}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: THEME_COLORS.background }}
    >
      {/* HUD */}
      {compact ? <CompactGameHUD /> : <GameHUD />}

      {/* Notification */}
      {notification && <Notification notification={notification} />}

      {/* Game Board */}
      <div className="flex-1 flex items-center justify-center">
        {compact ? <CompactGameBoard /> : <GameBoard />}
      </div>

      {/* Game Info Footer */}
      <div
        className="p-4 text-center text-sm border-t"
        style={{
          borderColor: THEME_COLORS.border,
          color: THEME_COLORS.textSecondary,
        }}
      >
        <p>
          Phase: <span className="font-semibold text-textPrimary">{phase.toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Lobby Screen - shown before game starts
 */
export function LobbyScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: THEME_COLORS.background }}
    >
      <div className="max-w-md w-full text-center space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h1
            className="text-5xl font-black tracking-tight"
            style={{ color: THEME_COLORS.textPrimary }}
          >
            MINESWEEPER
          </h1>
          <p
            className="text-xl font-semibold"
            style={{ color: THEME_COLORS.safe }}
          >
            ZK VERIFIED
          </p>
          <p className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>
            Prove your skills on the Stellar blockchain
          </p>
        </div>

        {/* Game Info */}
        <div
          className="p-6 rounded-lg space-y-4"
          style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.textSecondary }}>Grid Size</span>
            <span className="font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
              {GAME_CONFIG.GRID_SIZE}x{GAME_CONFIG.GRID_SIZE}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.textSecondary }}>Total Mines</span>
            <span className="font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
              {GAME_CONFIG.TOTAL_MINES}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.textSecondary }}>Time Limit</span>
            <span className="font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
              {GAME_CONFIG.TIMEOUT_MINUTES} minutes
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: THEME_COLORS.textSecondary }}>Max Score</span>
            <span className="font-semibold" style={{ color: THEME_COLORS.safe }}>
              {GAME_CONFIG.MAX_SCORE}
            </span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full py-4 px-8 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: THEME_COLORS.safe,
            color: THEME_COLORS.background,
          }}
        >
          START GAME
        </button>

        {/* Instructions */}
        <div className="text-left space-y-2 text-sm" style={{ color: THEME_COLORS.textSecondary }}>
          <p className="font-semibold" style={{ color: THEME_COLORS.textPrimary }}>How to play:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Click cells to reveal them (DIG)</li>
            <li>Flag cells you think contain mines</li>
            <li>Numbers show adjacent mine count</li>
            <li>Reveal all safe cells to win</li>
            <li>Higher score = better rewards</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Summary Screen - shown after game ends
 */
interface SummaryScreenProps {
  isWinner: boolean | null;
  score: number;
  moves: number;
  time: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export function SummaryScreen({
  isWinner,
  score,
  moves,
  time,
  onPlayAgain,
  onBackToLobby,
}: SummaryScreenProps) {
  const getResultColor = () => {
    if (isWinner === null) return THEME_COLORS.flag;
    return isWinner ? THEME_COLORS.safe : THEME_COLORS.mine;
  };

  const getResultText = () => {
    if (isWinner === null) return 'GAME OVER';
    return isWinner ? 'YOU WON!' : 'YOU LOST';
  };

  const getResultIcon = () => {
    const color = getResultColor();
    if (isWinner === null) return <Gamepad2 className="w-16 h-16" style={{ color }} />;
    return isWinner ? <Trophy className="w-16 h-16" style={{ color }} /> : <Zap className="w-16 h-16" style={{ color }} />;
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: THEME_COLORS.background }}
    >
      <div className="max-w-md w-full text-center space-y-8">
        {/* Result */}
        <div className="space-y-2 flex flex-col items-center justify-center" data-testid="summary-title">
          <div className="flex items-center justify-center">{getResultIcon()}</div>
          <h2
            className="text-4xl font-black"
            style={{ color: getResultColor() }}
          >
            {getResultText()}
          </h2>
        </div>

        {/* Stats */}
        <div
          className="p-6 rounded-lg space-y-4"
          style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
        >
          <div className="flex justify-between" data-testid="final-score">
            <span style={{ color: THEME_COLORS.textSecondary }}>Final Score</span>
            <span className="font-bold text-2xl" style={{ color: getResultColor() }}>
              {score}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: THEME_COLORS.textSecondary }}>Moves Made</span>
            <span className="font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
              {moves}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: THEME_COLORS.textSecondary }}>Time Taken</span>
            <span className="font-semibold font-mono" style={{ color: THEME_COLORS.textPrimary }}>
              {time}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 px-8 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: THEME_COLORS.safe,
              color: THEME_COLORS.background,
            }}
          >
            PLAY AGAIN
          </button>
          <button
            data-testid="new-game-btn"
            onClick={onBackToLobby}
            className="w-full py-3 px-8 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: THEME_COLORS.surface,
              color: THEME_COLORS.textPrimary,
              border: `1px solid ${THEME_COLORS.border}`,
            }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading/Processing Overlay
 */
export function GameLoadingOverlay({ message }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-safe border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-lg font-semibold" style={{ color: THEME_COLORS.textPrimary }}>
          {message || 'Processing...'}
        </p>
      </div>
    </div>
  );
}
