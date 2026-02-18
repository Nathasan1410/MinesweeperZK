/**
 * useMinesweeperGame Hook
 * Custom React hook that encapsulates game logic and timer management
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useMinesweeperStore, useGameProgress, useFormattedTime, useScoreBreakdown } from '@/lib/game/store';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseMinesweeperGameReturn {
  // Game state
  phase: import('@/lib/game/types').GamePhase;
  myMinefield: import('@/lib/game/types').Minefield;
  opponentMinefield: import('@/lib/game/types').Minefield | null;
  playerMoves: import('@/lib/game/types').PlayerMove[];
  timer: number;
  formattedTime: string;
  progress: number;
  score: number;
  opponentScore: number;
  isWinner: boolean | null;
  actionMode: 'reveal' | 'flag';
  showHint: boolean;
  hintsRemaining: number;
  hintCell: { x: number; y: number } | null;
  isProcessing: boolean;
  notification: import('@/lib/game/types').Notification | null;

  // Player info
  player: import('@/lib/game/types').Player | null;
  isDevWallet: boolean;

  // Room info
  roomId: string | null;
  roomCode: string | null;
  sessionId: number | null;

  // Seed info
  seed: string;
  seedCommit: import('@/lib/game/types').SeedCommit | null;
  opponentCommit: import('@/lib/game/types').SeedCommit | null;
  seedRevealed: boolean;
  opponentSeedRevealed: boolean;

  // ZK Proof
  zkProof: import('@/lib/game/types').ZKProof | null;

  // Contract
  startTxHash: string | null;
  endTxHash: string | null;

  // Actions
  handleCellClick: (x: number, y: number) => void;
  toggleActionMode: () => void;
  setShowHint: (show: boolean) => void;
  useHint: () => void;
  setPlayer: (player: import('@/lib/game/types').Player | null) => void;
  setDevWallet: (isDev: boolean) => void;
  setRoom: (roomId: string, roomCode: string) => void;
  setSessionId: (sessionId: number) => void;
  setSeed: (seed: string) => void;
  setSeedCommit: (commit: import('@/lib/game/types').SeedCommit) => void;
  setOpponentCommit: (commit: import('@/lib/game/types').SeedCommit) => void;
  revealSeed: () => void;
  startGame: () => void;
  resetGame: () => void;
  setNotification: (notification: import('@/lib/game/types').Notification | null) => void;
  showNotification: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => void;
  setProcessing: (processing: boolean) => void;
  setZKProof: (proof: import('@/lib/game/types').ZKProof) => void;
  setOpponentScore: (score: number) => void;
  setOpponentMinefield: (minefield: import('@/lib/game/types').Minefield) => void;
  clearRoom: () => void;

  // Derived state
  scoreBreakdown: ReturnType<typeof useScoreBreakdown>;
  isGameOver: boolean;
  canPlay: boolean;
  isMyTurn: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useMinesweeperGame(): UseMinesweeperGameReturn {
  // Store state
  const phase = useMinesweeperStore((s) => s.phase);
  const myMinefield = useMinesweeperStore((s) => s.myMinefield);
  const opponentMinefield = useMinesweeperStore((s) => s.opponentMinefield);
  const playerMoves = useMinesweeperStore((s) => s.playerMoves);
  const timer = useMinesweeperStore((s) => s.timer);
  const score = useMinesweeperStore((s) => s.myScore);
  const opponentScore = useMinesweeperStore((s) => s.opponentScore);
  const isWinner = useMinesweeperStore((s) => s.isWinner);
  const actionMode = useMinesweeperStore((s) => s.actionMode);
  const showHint = useMinesweeperStore((s) => s.showHint);
  const hintsRemaining = useMinesweeperStore((s) => s.hintsRemaining);
  const hintCell = useMinesweeperStore((s) => s.hintCell);
  const isProcessing = useMinesweeperStore((s) => s.isProcessing);
  const notification = useMinesweeperStore((s) => s.notification);
  const player = useMinesweeperStore((s) => s.player);
  const isDevWallet = useMinesweeperStore((s) => s.isDevWallet);
  const roomId = useMinesweeperStore((s) => s.roomId);
  const roomCode = useMinesweeperStore((s) => s.roomCode);
  const sessionId = useMinesweeperStore((s) => s.sessionId);
  const seed = useMinesweeperStore((s) => s.seed);
  const seedCommit = useMinesweeperStore((s) => s.seedCommit);
  const opponentCommit = useMinesweeperStore((s) => s.opponentCommit);
  const seedRevealed = useMinesweeperStore((s) => s.seedRevealed);
  const opponentSeedRevealed = useMinesweeperStore((s) => s.opponentSeedRevealed);
  const zkProof = useMinesweeperStore((s) => s.zkProof);
  const startTxHash = useMinesweeperStore((s) => s.startTxHash);
  const endTxHash = useMinesweeperStore((s) => s.endTxHash);

  // Store actions
  const handleCellClick = useMinesweeperStore((s) => s.handleCellClick);
  const toggleActionMode = useMinesweeperStore((s) => s.toggleActionMode);
  const setShowHint = useMinesweeperStore((s) => s.setShowHint);
  const useHint = useMinesweeperStore((s) => s.useHint);
  const setPlayer = useMinesweeperStore((s) => s.setPlayer);
  const setDevWallet = useMinesweeperStore((s) => s.setDevWallet);
  const setRoom = useMinesweeperStore((s) => s.setRoom);
  const setSessionId = useMinesweeperStore((s) => s.setSessionId);
  const setSeed = useMinesweeperStore((s) => s.setSeed);
  const setSeedCommit = useMinesweeperStore((s) => s.setSeedCommit);
  const setOpponentCommit = useMinesweeperStore((s) => s.setOpponentCommit);
  const revealSeed = useMinesweeperStore((s) => s.revealSeed);
  const startGame = useMinesweeperStore((s) => s.startGame);
  const resetGame = useMinesweeperStore((s) => s.resetGame);
  const setNotification = useMinesweeperStore((s) => s.setNotification);
  const showNotification = useMinesweeperStore((s) => s.showNotification);
  const setProcessing = useMinesweeperStore((s) => s.setProcessing);
  const setZKProof = useMinesweeperStore((s) => s.setZKProof);
  const setOpponentScore = useMinesweeperStore((s) => s.setOpponentScore);
  const setOpponentMinefield = useMinesweeperStore((s) => s.setOpponentMinefield);
  const clearRoom = useMinesweeperStore((s) => s.clearRoom);

  // Derived state
  const progress = useGameProgress();
  const formattedTime = useFormattedTime();
  const scoreBreakdown = useScoreBreakdown();

  // Computed values
  const isGameOver = phase === 'summary' || phase === 'reveal';
  const canPlay = phase === 'playing' && !isProcessing;
  const isMyTurn = phase === 'playing' || phase === 'waiting_opponent';

  // ============================================================================
  // GLOBAL TIMER MANAGEMENT (singleton pattern)
  // ============================================================================

  // Start/stop timer based on phase using store's singleton timer
  useEffect(() => {
    if (phase === 'playing') {
      useMinesweeperStore.getState().startGlobalTimer();
    } else {
      useMinesweeperStore.getState().stopGlobalTimer();
    }
  }, [phase]);

  // Cleanup on unmount - ensure timer is stopped
  useEffect(() => {
    return () => {
      useMinesweeperStore.getState().stopGlobalTimer();
    };
  }, []);

  // ============================================================================
  // TIMEOUT CHECK
  // ============================================================================

  useEffect(() => {
    if (phase !== 'playing') return;

    import('@/lib/game/types').then((module) => {
      const { TIMEOUT_MINUTES } = module.GAME_CONFIG;
      const timeoutMs = TIMEOUT_MINUTES * 60 * 1000;
      const startTime = useMinesweeperStore.getState().startTime;

      const timeoutId = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeoutMs && useMinesweeperStore.getState().phase === 'playing') {
          // Time's up - end game with loss
          useMinesweeperStore.getState().endGame(false);
          useMinesweeperStore.getState().showNotification(
            'error',
            'Time\'s Up!',
            `You exceeded the ${TIMEOUT_MINUTES} minute time limit.`
          );
        }
      }, timeoutMs - (Date.now() - startTime) + 1000); // Check 1 second after timeout

      return () => clearTimeout(timeoutId);
    });
  }, [phase]);

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // Game state
    phase,
    myMinefield,
    opponentMinefield,
    playerMoves,
    timer,
    formattedTime,
    progress,
    score,
    opponentScore,
    isWinner,
    actionMode,
    showHint,
    hintsRemaining,
    hintCell,
    isProcessing,
    notification,

    // Player info
    player,
    isDevWallet,

    // Room info
    roomId,
    roomCode,
    sessionId,

    // Seed info
    seed,
    seedCommit,
    opponentCommit,
    seedRevealed,
    opponentSeedRevealed,

    // ZK Proof
    zkProof,

    // Contract
    startTxHash,
    endTxHash,

    // Actions
    handleCellClick,
    toggleActionMode,
    setShowHint,
    useHint,
    setPlayer,
    setDevWallet,
    setRoom,
    setSessionId,
    setSeed,
    setSeedCommit,
    setOpponentCommit,
    revealSeed,
    startGame,
    resetGame,
    setNotification,
    showNotification,
    setProcessing,
    setZKProof,
    setOpponentScore,
    setOpponentMinefield,
    clearRoom,

    // Derived state
    scoreBreakdown,
    isGameOver,
    canPlay,
    isMyTurn,
  };
}

// ============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC USE CASES
// ============================================================================

/**
 * Hook for game board component
 */
export function useGameBoard() {
  const {
    myMinefield,
    handleCellClick,
    actionMode,
    showHint,
    canPlay,
  } = useMinesweeperGame();

  return {
    minefield: myMinefield,
    onCellClick: handleCellClick,
    actionMode,
    showHint,
    canPlay,
  };
}

/**
 * Hook for game HUD component
 */
export function useGameHUD() {
  const {
    timer,
    formattedTime,
    progress,
    score,
    actionMode,
    toggleActionMode,
    showHint,
    setShowHint,
    canPlay,
    phase,
  } = useMinesweeperGame();

  return {
    timer,
    formattedTime,
    progress,
    score,
    actionMode,
    toggleActionMode,
    showHint,
    setShowHint,
    canPlay,
    phase,
  };
}

/**
 * Hook for game summary component
 */
export function useGameSummary() {
  const {
    score,
    opponentScore,
    isWinner,
    scoreBreakdown,
    playerMoves,
    timer,
    formattedTime,
    startTxHash,
    endTxHash,
    zkProof,
  } = useMinesweeperGame();

  return {
    myScore: score,
    opponentScore,
    isWinner,
    scoreBreakdown,
    totalMoves: playerMoves.length,
    timeTaken: formattedTime,
    startTxHash,
    endTxHash,
    zkProof,
  };
}
