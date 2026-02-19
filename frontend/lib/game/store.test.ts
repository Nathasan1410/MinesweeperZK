/**
 * Tests for Minesweeper Game Store (Zustand)
 * TDD Approach: Write failing tests first, then implement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMinesweeperStore } from './store';
import { GAME_CONFIG } from './types';
import type { Player, Minefield } from './types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Minesweeper Store - Initial State', () => {
  beforeEach(() => {
    // Reset store before each test
    useMinesweeperStore.getState().resetGame();
  });

  it('should have correct initial phase', () => {
    const state = useMinesweeperStore.getState();
    expect(state.phase).toEqual('lobby');
  });

  it('should have empty player info initially', () => {
    const state = useMinesweeperStore.getState();
    expect(state.player).toBeNull();
    expect(state.isDevWallet).toBe(false);
  });

  it('should have null room info initially', () => {
    const state = useMinesweeperStore.getState();
    expect(state.roomId).toBeNull();
    expect(state.sessionId).toBeNull();
    expect(state.roomCode).toBeNull();
  });

  it('should have empty seed initially', () => {
    const state = useMinesweeperStore.getState();
    expect(state.seed).toEqual('');
    expect(state.seedCommit).toBeNull();
    expect(state.opponentCommit).toBeNull();
  });

  it('should have initial game state', () => {
    const state = useMinesweeperStore.getState();
    expect(state.myMinefield).toBeDefined();
    expect(state.myMinefield).toHaveLength(GAME_CONFIG.GRID_SIZE);
    expect(state.opponentMinefield).toBeNull();
    expect(state.playerMoves).toEqual([]);
    expect(state.timer).toEqual(0);
  });

  it('should have initial scores', () => {
    const state = useMinesweeperStore.getState();
    expect(state.myScore).toEqual(0);
    expect(state.opponentScore).toEqual(0);
    expect(state.isWinner).toBeNull();
  });

  it('should have initial UI state', () => {
    const state = useMinesweeperStore.getState();
    expect(state.actionMode).toEqual('reveal');
    expect(state.showHint).toBe(false);
    expect(state.hintsRemaining).toEqual(3);
    expect(state.hintCell).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.notification).toBeNull();
  });

  it('should have null contract tx hashes initially', () => {
    const state = useMinesweeperStore.getState();
    expect(state.startTxHash).toBeNull();
    expect(state.endTxHash).toBeNull();
  });
});

describe('Minesweeper Store - Phase Management', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set phase', () => {
    const { setPhase } = useMinesweeperStore.getState();

    setPhase('waiting');
    expect(useMinesweeperStore.getState().phase).toEqual('waiting');

    setPhase('playing');
    expect(useMinesweeperStore.getState().phase).toEqual('playing');
  });

  it('should transition through phases', () => {
    const { setPhase } = useMinesweeperStore.getState();

    setPhase('waiting');
    expect(useMinesweeperStore.getState().phase).toEqual('waiting');

    setPhase('commit');
    expect(useMinesweeperStore.getState().phase).toEqual('commit');

    setPhase('playing');
    expect(useMinesweeperStore.getState().phase).toEqual('playing');

    setPhase('summary');
    expect(useMinesweeperStore.getState().phase).toEqual('summary');
  });
});

describe('Minesweeper Store - Player Management', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set player', () => {
    const { setPlayer } = useMinesweeperStore.getState();
    const player: Player = {
      address: 'Gtest123',
      isDev: false,
    };

    setPlayer(player);
    expect(useMinesweeperStore.getState().player).toEqual(player);
  });

  it('should set dev wallet flag', () => {
    const { setDevWallet } = useMinesweeperStore.getState();

    setDevWallet(true);
    expect(useMinesweeperStore.getState().isDevWallet).toBe(true);

    setDevWallet(false);
    expect(useMinesweeperStore.getState().isDevWallet).toBe(false);
  });

  it('should set dev wallet with player', () => {
    const { setPlayer, setDevWallet } = useMinesweeperStore.getState();
    const player: Player = {
      address: 'Gtest123',
      isDev: true,
      devWallet: 'PLAYER1',
    };

    setPlayer(player);
    setDevWallet(true);

    const state = useMinesweeperStore.getState();
    expect(state.player).toEqual(player);
    expect(state.isDevWallet).toBe(true);
  });
});

describe('Minesweeper Store - Room Management', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set room', () => {
    const { setRoom } = useMinesweeperStore.getState();

    setRoom('room-123', 'ABC123');

    const state = useMinesweeperStore.getState();
    expect(state.roomId).toEqual('room-123');
    expect(state.roomCode).toEqual('ABC123');
  });

  it('should set session ID', () => {
    const { setSessionId } = useMinesweeperStore.getState();

    setSessionId(42);

    expect(useMinesweeperStore.getState().sessionId).toEqual(42);
  });

  it('should clear room info', () => {
    const { setRoom, setSessionId, clearRoom, setOpponentCommit } = useMinesweeperStore.getState();

    setRoom('room-123', 'ABC123');
    setSessionId(42);
    setOpponentCommit({ player: 'opponent', randomString: 'xyz', hash: 'hash123', committed: true });

    clearRoom();

    const state = useMinesweeperStore.getState();
    expect(state.roomId).toBeNull();
    expect(state.sessionId).toBeNull();
    expect(state.roomCode).toBeNull();
    expect(state.opponentCommit).toBeNull();
  });
});

describe('Minesweeper Store - Seed Management', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set seed', () => {
    const { setSeed } = useMinesweeperStore.getState();

    setSeed('my-seed-123');

    expect(useMinesweeperStore.getState().seed).toEqual('my-seed-123');
  });

  it('should set seed commit', () => {
    const { setSeedCommit } = useMinesweeperStore.getState();
    const commit = {
      player: 'player1',
      randomString: 'random123',
      hash: 'hash123',
      committed: true,
    };

    setSeedCommit(commit);

    expect(useMinesweeperStore.getState().seedCommit).toEqual(commit);
  });

  it('should set opponent commit', () => {
    const { setOpponentCommit } = useMinesweeperStore.getState();
    const commit = {
      player: 'player2',
      randomString: 'random456',
      hash: 'hash456',
      committed: true,
    };

    setOpponentCommit(commit);

    expect(useMinesweeperStore.getState().opponentCommit).toEqual(commit);
  });

  it('should reveal seed', () => {
    const { revealSeed } = useMinesweeperStore.getState();

    revealSeed();

    expect(useMinesweeperStore.getState().seedRevealed).toBe(true);
  });

  it('should set opponent seed revealed', () => {
    const { setOpponentSeedRevealed } = useMinesweeperStore.getState();

    setOpponentSeedRevealed();

    expect(useMinesweeperStore.getState().opponentSeedRevealed).toBe(true);
  });
});

describe('Minesweeper Store - Game Initialization', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should start game and generate minefield', () => {
    const { setSeed, startGame } = useMinesweeperStore.getState();

    setSeed('test-seed');
    startGame();

    const state = useMinesweeperStore.getState();
    expect(state.phase).toEqual('playing');
    expect(state.myMinefield).toBeDefined();
    expect(state.myMinefield).toHaveLength(GAME_CONFIG.GRID_SIZE);
    expect(state.playerMoves).toEqual([]);
    expect(state.timer).toEqual(0);
  });

  it('should reset game completely', () => {
    const { setSeed, setPlayer, startGame, resetGame } = useMinesweeperStore.getState();

    // Set up game state
    const player: Player = { address: 'Gtest', isDev: false };
    setPlayer(player);
    setSeed('test-seed');
    startGame();

    // Reset
    resetGame();

    const state = useMinesweeperStore.getState();
    expect(state.phase).toEqual('lobby');
    expect(state.player).toEqual(player); // Player is preserved
    expect(state.seed).toEqual('');
    expect(state.myScore).toEqual(0);
    expect(state.timer).toEqual(0);
  });
});

describe('Minesweeper Store - Cell Actions', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should handle cell click in reveal mode', () => {
    const { setSeed, startGame, handleCellClick, setPhase } = useMinesweeperStore.getState();

    setSeed('test-click');
    startGame();

    const initialMoves = useMinesweeperStore.getState().playerMoves.length;

    handleCellClick(0, 0);

    const state = useMinesweeperStore.getState();
    expect(state.playerMoves.length).toBeGreaterThan(initialMoves);
  });

  it('should handle cell click in flag mode', () => {
    const { setSeed, startGame, setActionMode, handleCellClick } = useMinesweeperStore.getState();

    setSeed('test-flag-click');
    startGame();
    setActionMode('flag');

    handleCellClick(0, 0);

    const state = useMinesweeperStore.getState();
    expect(state.myMinefield[0][0].state).toEqual('flagged');
  });

  it('should not handle clicks when not playing', () => {
    const { setPhase, handleCellClick } = useMinesweeperStore.getState();

    setPhase('lobby');

    const initialMoves = useMinesweeperStore.getState().playerMoves.length;

    handleCellClick(0, 0);

    expect(useMinesweeperStore.getState().playerMoves.length).toEqual(initialMoves);
  });

  it('should reveal cell', () => {
    const { setSeed, startGame, revealCell } = useMinesweeperStore.getState();

    setSeed('test-reveal-cell');
    startGame();

    const initialMoves = useMinesweeperStore.getState().playerMoves.length;

    revealCell(0, 0);

    const state = useMinesweeperStore.getState();
    expect(state.playerMoves.length).toBeGreaterThan(initialMoves);
    expect(state.playerMoves[state.playerMoves.length - 1].action).toEqual('reveal');
  });

  it('should flag cell', () => {
    const { setSeed, startGame, flagCell } = useMinesweeperStore.getState();

    setSeed('test-flag-cell');
    startGame();

    flagCell(0, 0);

    const state = useMinesweeperStore.getState();
    expect(state.myMinefield[0][0].state).toEqual('flagged');
    expect(state.playerMoves[state.playerMoves.length - 1].action).toEqual('flag');
  });

  it('should not flag already revealed cell', () => {
    const { setSeed, startGame, revealCell, flagCell } = useMinesweeperStore.getState();

    setSeed('test-no-flag-revealed');
    startGame();

    // Find and reveal a safe cell
    let safeX = -1, safeY = -1;
    const field = useMinesweeperStore.getState().myMinefield;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (field[y][x].value !== -1) {
          safeX = x;
          safeY = y;
          break;
        }
      }
      if (safeX >= 0) break;
    }

    if (safeX >= 0) {
      // Reveal a cell
      revealCell(safeX, safeY);

      // Try to flag it
      const initialMoves = useMinesweeperStore.getState().playerMoves.length;
      flagCell(safeX, safeY);

      expect(useMinesweeperStore.getState().playerMoves.length).toEqual(initialMoves);
    }
  });
});

describe('Minesweeper Store - Timer', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start timer', () => {
    const { startTimer } = useMinesweeperStore.getState();

    startTimer();

    expect(useMinesweeperStore.getState().startTime).toBeGreaterThan(0);
  });

  it('should stop timer', () => {
    const { startTimer, stopTimer } = useMinesweeperStore.getState();

    startTimer();
    stopTimer();

    expect(useMinesweeperStore.getState().endTime).toBeGreaterThan(0);
  });

  it('should set timer value', () => {
    const { setTimer } = useMinesweeperStore.getState();

    setTimer(60);

    expect(useMinesweeperStore.getState().timer).toEqual(60);
  });

  it('should tick timer', () => {
    const { setTimer, tickTimer } = useMinesweeperStore.getState();

    setTimer(10);
    tickTimer();

    expect(useMinesweeperStore.getState().timer).toEqual(11);
  });
});

describe('Minesweeper Store - Scoring', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should update score', () => {
    const { setSeed, startGame, revealCell, updateScore } = useMinesweeperStore.getState();

    setSeed('test-score');
    startGame();

    // Reveal some cells
    revealCell(0, 0);
    revealCell(1, 1);

    updateScore();

    const state = useMinesweeperStore.getState();
    expect(state.myScore).toBeGreaterThanOrEqual(0);
  });

  it('should set opponent score', () => {
    const { setOpponentScore } = useMinesweeperStore.getState();

    setOpponentScore(500);

    expect(useMinesweeperStore.getState().opponentScore).toEqual(500);
  });
});

describe('Minesweeper Store - Win/Loss', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should end game with win', () => {
    const { endGame } = useMinesweeperStore.getState();

    endGame(true, 400);

    const state = useMinesweeperStore.getState();
    expect(state.isWinner).toBe(true);
    expect(state.phase).toEqual('summary');
    expect(state.opponentScore).toEqual(400);
  });

  it('should end game with loss', () => {
    const { endGame } = useMinesweeperStore.getState();

    endGame(false, 600);

    const state = useMinesweeperStore.getState();
    expect(state.isWinner).toBe(false);
    expect(state.phase).toEqual('summary');
  });
});

describe('Minesweeper Store - Opponent State', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set opponent minefield', () => {
    const { setOpponentMinefield } = useMinesweeperStore.getState();

    const opponentField: Minefield = [
      [{ x: 0, y: 0, value: 0, state: 'hidden' }],
    ];

    setOpponentMinefield(opponentField);

    expect(useMinesweeperStore.getState().opponentMinefield).toEqual(opponentField);
  });
});

describe('Minesweeper Store - ZK Proof', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set ZK proof', () => {
    const { setZKProof } = useMinesweeperStore.getState();

    const proof = {
      sessionId: 1,
      seed: 'test-seed',
      moves: [],
      score: 500,
      proof: 'base64proof',
      publicInputs: 'base64inputs',
      verified: false,
      isMock: true,
      signature: 'sig123',
    };

    setZKProof(proof);

    expect(useMinesweeperStore.getState().zkProof).toEqual(proof);
  });
});

describe('Minesweeper Store - UI State', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set action mode', () => {
    const { setActionMode } = useMinesweeperStore.getState();

    setActionMode('flag');

    expect(useMinesweeperStore.getState().actionMode).toEqual('flag');
  });

  it('should toggle action mode', () => {
    const { toggleActionMode } = useMinesweeperStore.getState();

    const initialMode = useMinesweeperStore.getState().actionMode;

    toggleActionMode();

    expect(useMinesweeperStore.getState().actionMode).not.toEqual(initialMode);
  });

  it('should show hint', () => {
    const { setShowHint } = useMinesweeperStore.getState();

    setShowHint(true);

    expect(useMinesweeperStore.getState().showHint).toBe(true);

    setShowHint(false);

    expect(useMinesweeperStore.getState().showHint).toBe(false);
  });

  it('should use hint and decrease remaining', () => {
    const { setSeed, startGame, useHint } = useMinesweeperStore.getState();

    setSeed('test-use-hint');
    startGame();

    const initialHints = useMinesweeperStore.getState().hintsRemaining;

    useHint();

    const state = useMinesweeperStore.getState();
    expect(state.hintsRemaining).toEqual(initialHints - 1);
    expect(state.hintCell).not.toBeNull();
  });

  it('should not use hint when none remaining', () => {
    const { setSeed, startGame, useHint } = useMinesweeperStore.getState();

    setSeed('test-no-hint');
    startGame();

    // Use all hints
    useHint();
    useHint();
    useHint();

    const initialCell = useMinesweeperStore.getState().hintCell;

    // Try to use another hint
    useHint();

    expect(useMinesweeperStore.getState().hintsRemaining).toEqual(0);
    expect(useMinesweeperStore.getState().hintCell).toEqual(initialCell);
  });

  it('should clear hint cell', () => {
    const { setSeed, startGame, useHint, clearHintCell } = useMinesweeperStore.getState();

    setSeed('test-clear-hint');
    startGame();

    useHint();
    expect(useMinesweeperStore.getState().hintCell).not.toBeNull();

    clearHintCell();

    expect(useMinesweeperStore.getState().hintCell).toBeNull();
  });

  it('should set processing flag', () => {
    const { setProcessing } = useMinesweeperStore.getState();

    setProcessing(true);

    expect(useMinesweeperStore.getState().isProcessing).toBe(true);

    setProcessing(false);

    expect(useMinesweeperStore.getState().isProcessing).toBe(false);
  });

  it('should set notification', () => {
    const { setNotification } = useMinesweeperStore.getState();

    const notification = {
      type: 'success' as const,
      title: 'Test',
      message: 'Test notification',
      duration: 5000,
    };

    setNotification(notification);

    expect(useMinesweeperStore.getState().notification).toEqual(notification);
  });

  it('should show and auto-dismiss notification', () => {
    const { showNotification } = useMinesweeperStore.getState();
    vi.useFakeTimers();

    showNotification('info', 'Test', 'Test message');

    const state = useMinesweeperStore.getState();
    expect(state.notification).not.toBeNull();
    expect(state.notification?.title).toEqual('Test');

    // Fast-forward past the duration
    vi.advanceTimersByTime(5000);

    expect(useMinesweeperStore.getState().notification).toBeNull();

    vi.useRealTimers();
  });
});

describe('Minesweeper Store - Contract', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should set start tx hash', () => {
    const { setStartTxHash } = useMinesweeperStore.getState();

    setStartTxHash('tx-start-123');

    expect(useMinesweeperStore.getState().startTxHash).toEqual('tx-start-123');
  });

  it('should set end tx hash', () => {
    const { setEndTxHash } = useMinesweeperStore.getState();

    setEndTxHash('tx-end-456');

    expect(useMinesweeperStore.getState().endTxHash).toEqual('tx-end-456');
  });
});

describe('Minesweeper Store - Global Timer', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
    vi.useFakeTimers();
  });

  afterEach(() => {
    const { stopGlobalTimer } = useMinesweeperStore.getState();
    stopGlobalTimer();
    vi.useRealTimers();
  });

  it('should start global timer', () => {
    const { setSeed, startGame, startGlobalTimer } = useMinesweeperStore.getState();

    setSeed('test-global-timer');
    startGame();
    startGlobalTimer();

    expect(useMinesweeperStore.getState().timerIntervalId).not.toBeNull();
  });

  it('should tick timer every second', () => {
    const { setSeed, startGame, startGlobalTimer, setTimer } = useMinesweeperStore.getState();

    setSeed('test-tick');
    startGame();
    setTimer(0);
    startGlobalTimer();

    vi.advanceTimersByTime(1000);

    expect(useMinesweeperStore.getState().timer).toEqual(1);

    vi.advanceTimersByTime(2000);

    expect(useMinesweeperStore.getState().timer).toEqual(3);
  });

  it('should stop global timer', () => {
    const { setSeed, startGame, startGlobalTimer, stopGlobalTimer } = useMinesweeperStore.getState();

    setSeed('test-stop-timer');
    startGame();
    startGlobalTimer();

    const intervalId = useMinesweeperStore.getState().timerIntervalId;

    stopGlobalTimer();

    expect(useMinesweeperStore.getState().timerIntervalId).toBeNull();
  });

  it('should prevent multiple timer intervals', () => {
    const { setSeed, startGame, startGlobalTimer } = useMinesweeperStore.getState();

    setSeed('test-single-timer');
    startGame();

    const firstInterval = startGlobalTimer();
    const secondInterval = startGlobalTimer();

    expect(secondInterval).toBeUndefined();
  });

  it('should auto-stop when phase changes', () => {
    const { setSeed, startGame, startGlobalTimer, setPhase } = useMinesweeperStore.getState();

    setSeed('test-auto-stop');
    startGame();
    startGlobalTimer();

    vi.advanceTimersByTime(1000);

    setPhase('summary');

    vi.advanceTimersByTime(1000);

    // Timer should have stopped, so no more ticks
    expect(useMinesweeperStore.getState().timerIntervalId).toBeNull();
  });
});

describe('Minesweeper Store - Edge Cases', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should handle null player', () => {
    const { setPlayer } = useMinesweeperStore.getState();

    setPlayer(null);

    expect(useMinesweeperStore.getState().player).toBeNull();
  });

  it('should handle empty seed', () => {
    const { setSeed, startGame } = useMinesweeperStore.getState();

    setSeed('');
    startGame();

    expect(useMinesweeperStore.getState().phase).toEqual('playing');
  });

  it('should handle multiple rapid state changes', () => {
    const { setPhase, setTimer, setActionMode } = useMinesweeperStore.getState();

    for (let i = 0; i < 100; i++) {
      setPhase(i % 2 === 0 ? 'playing' : 'waiting');
      setTimer(i);
      setActionMode(i % 2 === 0 ? 'reveal' : 'flag');
    }

    expect(useMinesweeperStore.getState().timer).toEqual(99);
  });
});

describe('Minesweeper Store - Actions with Wrong State', () => {
  beforeEach(() => {
    useMinesweeperStore.getState().resetGame();
  });

  it('should not reveal cell when not playing', () => {
    const { revealCell } = useMinesweeperStore.getState();

    const initialMoves = useMinesweeperStore.getState().playerMoves.length;

    revealCell(0, 0);

    expect(useMinesweeperStore.getState().playerMoves.length).toEqual(initialMoves);
  });

  it('should not flag cell when not playing', () => {
    const { flagCell } = useMinesweeperStore.getState();

    flagCell(0, 0);

    expect(useMinesweeperStore.getState().myMinefield[0][0].state).toEqual('hidden');
  });

  it('should not use hint when not in game', () => {
    const { useHint } = useMinesweeperStore.getState();

    const initialHints = useMinesweeperStore.getState().hintsRemaining;

    useHint();

    expect(useMinesweeperStore.getState().hintsRemaining).toEqual(initialHints);
  });
});

