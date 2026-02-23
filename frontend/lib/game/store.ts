/**
 * Minesweeper Game Store
 * Zustand-based state management for the game
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GAME_CONFIG,
  GamePhase,
  Minefield,
  PlayerMove,
  SeedCommit,
  ZKProof,
  Notification,
  Player,
} from './types';
import {
  generateMinefield,
  revealCell,
  toggleFlag,
  revealAllMines,
  checkWin,
  checkLoss,
  calculateScore,
  getScoreBreakdown,
  cloneMinefield,
  createEmptyMinefield,
  canReveal,
  canFlag,
  markSafeCells,
  getHint,
} from './minesweeper';

// ============================================================================
// GAME STORE STATE
// ============================================================================

interface MinesweeperState {
  // Game phase
  phase: GamePhase;

  // Player info
  player: Player | null;
  isDevWallet: boolean;

  // Room/Session info
  roomId: string | null;
  sessionId: number | null;
  roomCode: string | null;

  // Seed & Commitment
  seed: string;
  seedCommit: SeedCommit | null;
  opponentCommit: SeedCommit | null;
  seedRevealed: boolean;
  opponentSeedRevealed: boolean;

  // Game state
  myMinefield: Minefield;
  opponentMinefield: Minefield | null;
  playerMoves: PlayerMove[];
  startTime: number;
  endTime: number | null;
  timer: number; // seconds

  // Scoring
  myScore: number;
  opponentScore: number;
  isWinner: boolean | null;

  // ZK Proof
  zkProof: ZKProof | null;

  // UI State
  actionMode: 'reveal' | 'flag';
  showHint: boolean;
  hintsRemaining: number;
  hintCell: { x: number; y: number } | null;
  isProcessing: boolean;
  notification: Notification | null;

  // Contract tx hashes
  startTxHash: string | null;
  endTxHash: string | null;

  // Post-game snapshot (preserved after game ends for summary)
  finalMinefield: Minefield | null;
  finalScore: number;
  finalTime: string;

  // Global timer singleton (prevents multiple intervals)
  timerIntervalId: ReturnType<typeof setInterval> | null;
}

// ============================================================================
// GAME STORE ACTIONS
// ============================================================================

interface MinesweeperActions {
  // Phase management
  setPhase: (phase: GamePhase) => void;

  // Player management
  setPlayer: (player: Player | null) => void;
  setDevWallet: (isDev: boolean) => void;

  // Room management
  setRoom: (roomId: string, roomCode: string) => void;
  setSessionId: (sessionId: number) => void;
  clearRoom: () => void;

  // Seed & Commitment
  setSeed: (seed: string) => void;
  setSeedCommit: (commit: SeedCommit) => void;
  setOpponentCommit: (commit: SeedCommit) => void;
  revealSeed: () => void;
  setOpponentSeedRevealed: () => void;

  // Game initialization
  startGame: () => void;
  resetGame: () => void;

  // Cell actions
  handleCellClick: (x: number, y: number) => void;
  revealCell: (x: number, y: number) => void;
  flagCell: (x: number, y: number) => void;

  // Timer
  startTimer: () => void;
  stopTimer: () => void;
  setTimer: (time: number) => void;
  tickTimer: () => void;
  startGlobalTimer: () => void;
  stopGlobalTimer: () => void;

  // Scoring
  updateScore: () => void;
  setOpponentScore: (score: number) => void;

  // Win/Loss
  endGame: (won: boolean, opponentScore?: number) => void;

  // Opponent state
  setOpponentMinefield: (minefield: Minefield) => void;

  // ZK Proof
  setZKProof: (proof: ZKProof) => void;

  // UI State
  setActionMode: (mode: 'reveal' | 'flag') => void;
  toggleActionMode: () => void;
  setShowHint: (show: boolean) => void;
  useHint: () => void;
  clearHintCell: () => void;
  setProcessing: (processing: boolean) => void;
  setNotification: (notification: Notification | null) => void;
  showNotification: (type: Notification['type'], title: string, message: string) => void;

  // Contract
  setStartTxHash: (hash: string) => void;
  setEndTxHash: (hash: string) => void;

  // Post-game snapshot
  saveGameSnapshot: () => void;
}

// ============================================================================
// COMBINED STORE TYPE
// ============================================================================

type MinesweeperStore = MinesweeperState & MinesweeperActions;

// ============================================================================
// STORE CREATION
// ============================================================================

export const useMinesweeperStore = create<MinesweeperStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // INITIAL STATE
      // ========================================================================

      phase: 'lobby',

      player: null,
      isDevWallet: false,

      roomId: null,
      sessionId: null,
      roomCode: null,

      seed: '',
      seedCommit: null,
      opponentCommit: null,
      seedRevealed: false,
      opponentSeedRevealed: false,

      myMinefield: createEmptyMinefield(),
      opponentMinefield: null,
      playerMoves: [],
      startTime: 0,
      endTime: null,
      timer: 0,

      myScore: 0,
      opponentScore: 0,
      isWinner: null,

      zkProof: null,

      actionMode: 'reveal',
      showHint: false,
      hintsRemaining: 3,
      hintCell: null,
      isProcessing: false,
      notification: null,

      startTxHash: null,
      endTxHash: null,
      finalMinefield: null,
      finalScore: 0,
      finalTime: '00:00',
      timerIntervalId: null,

      // ========================================================================
      // PHASE MANAGEMENT
      // ========================================================================

      setPhase: (phase) => set({ phase }),

      // ========================================================================
      // PLAYER MANAGEMENT
      // ========================================================================

      setPlayer: (player) => set({ player }),
      setDevWallet: (isDev) => set({ isDevWallet: isDev }),

      // ========================================================================
      // ROOM MANAGEMENT
      // ========================================================================

      setRoom: (roomId, roomCode) => set({ roomId, roomCode }),
      setSessionId: (sessionId) => set({ sessionId }),
      clearRoom: () => set({
        roomId: null,
        sessionId: null,
        roomCode: null,
        opponentCommit: null,
        opponentSeedRevealed: false,
        opponentMinefield: null,
      }),

      // ========================================================================
      // SEED & COMMITMENT
      // ========================================================================

      setSeed: (seed) => set({ seed }),
      setSeedCommit: (commit) => set({ seedCommit: commit }),
      setOpponentCommit: (commit) => set({ opponentCommit: commit }),
      revealSeed: () => set({ seedRevealed: true }),
      setOpponentSeedRevealed: () => set({ opponentSeedRevealed: true }),

      // ========================================================================
      // GAME INITIALIZATION
      // ========================================================================

      startGame: () => {
        const { seed, myMinefield } = get();

        // Generate minefield from seed
        const newMinefield = generateMinefield(seed);

        set({
          myMinefield: newMinefield,
          playerMoves: [],
          startTime: Date.now(),
          endTime: null,
          timer: 0,
          phase: 'playing',
          myScore: 0,
        });
      },

      resetGame: () => set({
        myMinefield: createEmptyMinefield(),
        opponentMinefield: null,
        playerMoves: [],
        startTime: 0,
        endTime: null,
        timer: 0,
        myScore: 0,
        opponentScore: 0,
        isWinner: null,
        zkProof: null,
        seed: '',
        seedCommit: null,
        opponentCommit: null,
        seedRevealed: false,
        opponentSeedRevealed: false,
        phase: 'lobby',
        hintsRemaining: 3,
        hintCell: null,
        showHint: false,
        finalMinefield: null,
        finalScore: 0,
        finalTime: '00:00',
      }),

      // ========================================================================
      // CELL ACTIONS
      // ========================================================================

      handleCellClick: (x, y) => {
        const { actionMode, myMinefield, phase } = get();

        if (phase !== 'playing') return;

        if (actionMode === 'reveal') {
          get().revealCell(x, y);
        } else {
          get().flagCell(x, y);
        }
      },

      revealCell: (x, y) => {
        const { myMinefield, playerMoves, phase } = get();

        if (phase !== 'playing') return;
        if (!canReveal(myMinefield, x, y)) return;

        const result = revealCell(myMinefield, x, y);
        const move: PlayerMove = {
          x,
          y,
          action: 'reveal',
          timestamp: Date.now(),
          result: result.hitMine ? 'mine' : 'safe',
        };

        const newMoves = [...playerMoves, move];

        // Check win/loss
        const won = checkWin(result.minefield);
        const lost = result.hitMine;

        let newPhase: GamePhase = phase;
        let finalMinefield = result.minefield;

        if (lost) {
          finalMinefield = revealAllMines(result.minefield);
          newPhase = 'reveal';
        } else if (won) {
          newPhase = 'reveal';
        }

        set({
          myMinefield: finalMinefield,
          playerMoves: newMoves,
          phase: newPhase,
        });

        // Update score
        get().updateScore();

        // Trigger end game if finished
        if (won || lost) {
          get().endGame(won);
        }
      },

      flagCell: (x, y) => {
        const { myMinefield, playerMoves, phase } = get();

        if (phase !== 'playing') return;
        if (!canFlag(myMinefield, x, y)) return;

        const newMinefield = toggleFlag(myMinefield, x, y);
        const move: PlayerMove = {
          x,
          y,
          action: 'flag',
          timestamp: Date.now(),
        };

        set({
          myMinefield: newMinefield,
          playerMoves: [...playerMoves, move],
        });

        // Update score after flagging
        get().updateScore();
      },

      // ========================================================================
      // TIMER
      // ========================================================================

      startTimer: () => set({ startTime: Date.now() }),

      stopTimer: () => set({ endTime: Date.now() }),

      setTimer: (time) => set({ timer: time }),

      tickTimer: () => {
        const { timer } = get();
        set({ timer: timer + 1 });
      },

      // ========================================================================
      // SCORING
      // ========================================================================

      updateScore: () => {
        const { myMinefield } = get();
        const score = calculateScore(myMinefield);
        set({ myScore: score });
      },

      setOpponentScore: (score) => set({ opponentScore: score }),

      // ========================================================================
      // WIN/LOSS
      // ========================================================================

      endGame: (won, opponentScore) => {
        const { myMinefield, playerMoves, seed } = get();

        // Reveal all mines
        const finalMinefield = revealAllMines(myMinefield);
        const score = calculateScore(finalMinefield);

        set({
          myMinefield: finalMinefield,
          myScore: score,
          isWinner: won,
          endTime: Date.now(),
          phase: 'summary',
          opponentScore: opponentScore ?? 0,
        });
      },

      // ========================================================================
      // OPPONENT STATE
      // ========================================================================

      setOpponentMinefield: (minefield) => set({ opponentMinefield: minefield }),

      // ========================================================================
      // ZK PROOF
      // ========================================================================

      setZKProof: (proof) => set({ zkProof: proof }),

      // ========================================================================
      // UI STATE
      // ========================================================================

      setActionMode: (mode) => set({ actionMode: mode }),

      toggleActionMode: () => {
        const { actionMode } = get();
        set({ actionMode: actionMode === 'reveal' ? 'flag' : 'reveal' });
      },

      setShowHint: (show) => {
        const { myMinefield, hintCell } = get();
        if (show) {
          // If we have a hint cell, show only that one
          if (hintCell) {
            const newField = cloneMinefield(myMinefield);
            newField[hintCell.y][hintCell.x].isSafe = true;
            set({ myMinefield: newField, showHint: true });
          } else {
            set({ showHint: true });
          }
        } else {
          // Remove hint markers
          const cleanField = cloneMinefield(myMinefield);
          for (let y = 0; y < cleanField.length; y++) {
            for (let x = 0; x < cleanField[y].length; x++) {
              cleanField[y][x].isSafe = undefined;
            }
          }
          set({ myMinefield: cleanField, showHint: false });
        }
      },

      useHint: () => {
        const { myMinefield, hintsRemaining, hintCell } = get();
        if (hintsRemaining <= 0) return;

        // Get a single hint cell
        const hint = getHint(myMinefield);
        if (!hint) return;

        // Mark only this cell as safe
        const newField = cloneMinefield(myMinefield);
        newField[hint.y][hint.x].isSafe = true;

        set({
          myMinefield: newField,
          hintsRemaining: hintsRemaining - 1,
          hintCell: hint,
          showHint: true,
        });
      },

      clearHintCell: () => {
        set({ hintCell: null });
      },

      setProcessing: (processing) => set({ isProcessing: processing }),

      setNotification: (notification) => set({ notification }),

      showNotification: (type, title, message) => {
        const notification: Notification = {
          type,
          title,
          message,
          duration: 5000,
        };
        set({ notification });

        // Auto-dismiss after duration
        if (notification.duration) {
          setTimeout(() => {
            const current = get().notification;
            if (current?.title === title) {
              set({ notification: null });
            }
          }, notification.duration);
        }
      },

      // ========================================================================
      // GLOBAL TIMER SINGLETON
      // ========================================================================

      startGlobalTimer: () => {
        const { timerIntervalId, phase } = get();

        console.log('[startGlobalTimer] Called:', { timerIntervalId, phase });

        // Prevent multiple intervals - only start if not already running
        if (timerIntervalId) {
          console.log('[startGlobalTimer] Already running, skipping');
          return;
        }

        // Only start timer when game is in playing phase
        if (phase !== 'playing') {
          console.log('[startGlobalTimer] Not in playing phase, skipping');
          return;
        }

        // Set the interval ID IMMEDIATELY to prevent race conditions
        // Use a temporary value that will be replaced once we have the real intervalId
        console.log('[startGlobalTimer] Starting timer...');
        set({ timerIntervalId: 'starting' as unknown as NodeJS.Timeout });

        const intervalId = setInterval(() => {
          const state = get();
          if (state.phase === 'playing') {
            console.log('[Timer] Tick:', state.timer + 1);
            set({ timer: state.timer + 1 });
          } else {
            // Auto-stop if phase changed
            console.log('[Timer] Phase changed, stopping');
            clearInterval(intervalId);
            set({ timerIntervalId: null });
          }
        }, 1000);

        // Update with the real intervalId
        set({ timerIntervalId: intervalId });
        console.log('[startGlobalTimer] Timer started with ID:', intervalId);
      },

      stopGlobalTimer: () => {
        const { timerIntervalId } = get();
        console.log('[stopGlobalTimer] Called:', { timerIntervalId });
        // Type guard: timerIntervalId is 'starting' when timer is starting up
        const isStarting = (timerIntervalId as unknown) === 'starting';
        if (timerIntervalId && !isStarting) {
          clearInterval(timerIntervalId);
          console.log('[stopGlobalTimer] Timer cleared');
        }
        set({ timerIntervalId: null });
      },

      // ========================================================================
      // CONTRACT
      // ========================================================================

      setStartTxHash: (hash) => set({ startTxHash: hash }),
      setEndTxHash: (hash) => set({ endTxHash: hash }),

      saveGameSnapshot: () => {
        const { myMinefield, myScore, timer } = get();
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        set({
          finalMinefield: cloneMinefield(myMinefield),
          finalScore: myScore,
          finalTime: formattedTime,
        });
      },
    }),
    {
      name: 'minesweeper-game-storage',
      // Only persist certain fields
      partialize: (state) => ({
        player: state.player,
        isDevWallet: state.isDevWallet,
        actionMode: state.actionMode,
      }),
    }
  )
);

// ============================================================================
// SELECTORS (computed values)
// ============================================================================

/**
 * Get the current game progress percentage
 */
export const useGameProgress = () => {
  const { myMinefield } = useMinesweeperStore();
  const { TOTAL_CELLS, TOTAL_MINES } = GAME_CONFIG;

  let revealedCount = 0;
  for (const row of myMinefield) {
    for (const cell of row) {
      if (cell.state === 'revealed' && cell.value !== -1) {
        revealedCount++;
      }
    }
  }

  const safeCells = TOTAL_CELLS - TOTAL_MINES;
  return Math.round((revealedCount / safeCells) * 100);
};

/**
 * Get the formatted time string
 */
export const useFormattedTime = () => {
  const timer = useMinesweeperStore((s) => s.timer);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get the score breakdown
 */
export const useScoreBreakdown = () => {
  const { myMinefield } = useMinesweeperStore();
  return getScoreBreakdown(myMinefield);
};
