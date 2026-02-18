/**
 * Minesweeper ZK - Core Game Types
 * All types used across the game application
 */

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

export const GAME_CONFIG = {
  GRID_SIZE: 8,
  TOTAL_MINES: 10,
  TOTAL_CELLS: 64, // 8x8
  TIMEOUT_MINUTES: 15,
  MAX_SCORE: 1000,
  SCORING: {
    PER_REVEALED_PERCENT: 5,  // 5 points per % revealed
    PER_FLAGGED_PERCENT: 5,   // 5 points per % correctly flagged
    WRONG_FLAG_PENALTY: 50,   // 50 points for wrong flag
  },
} as const;

// ============================================================================
// CELL TYPES
// ============================================================================

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // Number of adjacent mines
export type CellState = 'hidden' | 'revealed' | 'flagged' | 'exploded';

export interface Cell {
  x: number;
  y: number;
  value: CellValue | -1; // -1 = mine
  state: CellState;
  isSafe?: boolean; // Hint from algorithm
}

export type Minefield = Cell[][];

// ============================================================================
// GAME STATES
// ============================================================================

export type GamePhase =
  | 'lobby'
  | 'waiting'
  | 'commit'
  | 'playing'
  | 'waiting_opponent'
  | 'reveal'
  | 'summary';

export type GameStatus =
  | 'not_started'
  | 'in_progress'
  | 'player1_won'
  | 'player2_won'
  | 'draw'
  | 'timeout'
  | 'aborted';

// ============================================================================
// PLAYER DATA
// ============================================================================

export interface Player {
  address: string;
  isDev: boolean;
  devWallet?: 'PLAYER1' | 'PLAYER2';
}

export interface PlayerGameState {
  player: Player;
  minefield: Minefield;
  revealedCount: number;
  flaggedCount: number;
  correctFlags: number;
  wrongFlags: number;
  isAlive: boolean;
  startTime: number;
  endTime?: number;
  score: number;
}

// ============================================================================
// ROOM & SESSION
// ============================================================================

export interface Room {
  id: string;
  code: string; // 6-character room code
  name: string;
  creator: string;
  betAmount: number;
  isPublic: boolean;
  status: GameStatus;
  createdAt: number;
  player1?: Player;
  player2?: Player;
}

export interface GameSession {
  id: string;
  roomId: string;
  sessionId: number; // Contract session ID
  phase: GamePhase;
  seed: string;
  player1State: PlayerGameState;
  player2State: PlayerGameState;
  winner?: Player;
  timeoutAt?: number;
  zKProof?: ZKProof;
}

// ============================================================================
// ZK PROOF TYPES
// ============================================================================

export interface ZKProof {
  sessionId: number;
  seed: string;
  moves: PlayerMove[];
  score: number;
  proof: string; // Base64 encoded proof
  publicInputs: string; // Base64 encoded public inputs
  verified: boolean;
  isMock?: boolean; // Discriminator for type narrowing
}

export interface MockZKProof extends ZKProof {
  isMock: true;
  signature: string; // Mock signature for demo
}

export interface RealZKProof extends ZKProof {
  isMock: false;
  imageId: string; // RISC Zero image ID
  journal: string; // RISC Zero journal output
}

// ============================================================================
// MOVES & ACTIONS
// ============================================================================

export type MoveAction = 'reveal' | 'flag';

export interface PlayerMove {
  x: number;
  y: number;
  action: MoveAction;
  timestamp: number;
  result?: 'safe' | 'mine' | 'already_revealed';
}

export interface SeedCommit {
  player: string;
  randomString: string;
  hash: string;
  committed: boolean;
}

// ============================================================================
// SCORING
// ============================================================================

export interface ScoreBreakdown {
  revealedPercent: number;
  revealedPoints: number;
  flaggedPercent: number;
  flaggedPoints: number;
  wrongFlagPenalty: number;
  totalScore: number;
}

export interface GameResult {
  sessionId: number;
  player1: {
    address: string;
    score: number;
    breakdown: ScoreBreakdown;
  };
  player2: {
    address: string;
    score: number;
    breakdown: ScoreBreakdown;
  };
  winner: string;
  endedBy: 'completion' | 'timeout' | 'surrender';
  proof?: ZKProof;
}

// ============================================================================
// FIREBASE SYNC TYPES
// ============================================================================

export interface FirebaseRoom {
  id: string;
  code: string;
  name: string;
  creator: string;
  creatorAddress: string;
  betAmount: number;
  isPublic: boolean;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  player1Address?: string;
  player2Address?: string;
  player1Committed?: boolean;
  player2Committed?: boolean;
  seed?: string;
  createdAt: number;
  expiresAt: number;
}

export interface FirebaseGameState {
  sessionId: string;
  roomId: string;
  phase: GamePhase;
  currentPlayer: string;
  player1Score: number;
  player2Score: number;
  player1Finished: boolean;
  player2Finished: boolean;
  winner?: string;
  lastUpdate: number;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface UIState {
  currentPhase: GamePhase;
  selectedCell: { x: number; y: number } | null;
  actionMode: 'reveal' | 'flag';
  showHint: boolean;
  isProcessing: boolean;
  notification: Notification | null;
}

export interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

// ============================================================================
// COLOR THEME (Matte Logic Palette)
// ============================================================================

export const THEME_COLORS = {
  // Canvas & Background
  background: '#121213',
  surface: '#1A1A1B',
  border: '#3A3A3C',

  // Text
  textPrimary: '#F8F9FA',
  textSecondary: '#818384',

  // Accents (Functional)
  safe: '#538D4E',      // Matte Green - Correct/Safe
  flag: '#B59F3B',      // Matte Yellow - Flag/Pending
  mine: '#DA4F49',      // Matte Red - Mine/Dead/Error
  action: '#D7DADC',    // Light Gray - Button

  // Numbers (classic Minesweeper colors, matte version)
  num1: '#5cd7fe',
  num2: '#60f760',
  num3: '#fe5f5f',
  num4: '#8a8aff',
  num5: '#fe8f8f',
  num6: '#00ffff',
  num7: '#000000',
  num8: '#808080',
} as const;
