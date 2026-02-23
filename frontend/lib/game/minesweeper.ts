/**
 * Minesweeper Core Game Logic
 * Deterministic, seed-based minefield generation for ZK verification
 *
 * This module implements the core game mechanics of Minesweeper with deterministic
 * minefield generation using seeded random number generation. This ensures that
 * the same seed always produces the same minefield, which is essential for
 * ZK proof verification.
 *
 * @packageDocumentation
 */

import { GAME_CONFIG, Cell, CellValue, CellState, Minefield, PlayerMove } from './types';

// ============================================================================
// SEEDED RANDOM NUMBER GENERATOR (for deterministic minefield)
// ============================================================================

/**
 * Seeded PRNG using Mulberry32 algorithm
 * Produces the same sequence of numbers for the same seed
 *
 * This pseudo-random number generator is deterministic, meaning that for the
 * same input seed, it will always produce the same sequence of random numbers.
 * This is crucial for ZK proofs as it allows verification that both players
 * used the same minefield configuration.
 */
class SeededRandom {
  private state: number;

  /**
   * Initialize the seeded random number generator
   * @param seed - The seed string to initialize the RNG
   */
  constructor(seed: string) {
    // Hash the seed string to a number
    this.state = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get next random number in [0, 1)
   */
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Get random integer in [min, max)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Shuffle array in place using Fisher-Yates with seeded RNG
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// ============================================================================
// MINEFIELD GENERATION
// ============================================================================

/**
 * Generate a minefield from a seed
 * Same seed always produces the same minefield
 *
 * This is the core function that creates the minefield layout. It uses a seeded
 * random number generator to ensure deterministic results, which is essential for
 * fair gameplay and ZK proof verification.
 *
 * @param seed - The seed string used to generate the minefield
 * @returns A Minefield object with randomly placed mines
 *
 * @example
 * // Generate a minefield with a specific seed
 * const minefield = generateMinefield('my-secret-seed');
 * console.log(minefield[0][0].value); // Always the same for the same seed
 */
export function generateMinefield(seed: string): Minefield {
  const rng = new SeededRandom(seed);
  const { GRID_SIZE, TOTAL_MINES } = GAME_CONFIG;
  const size = GRID_SIZE;

  // Initialize empty minefield
  const minefield: Minefield = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x): Cell => ({
      x,
      y,
      value: 0,
      state: 'hidden',
    }))
  );

  // Place mines randomly using seeded RNG
  const allPositions = Array.from({ length: size * size }, (_, i) => i);
  const minePositions = rng.shuffle(allPositions).slice(0, TOTAL_MINES);

  for (const pos of minePositions) {
    const x = pos % size;
    const y = Math.floor(pos / size);
    minefield[y][x].value = -1; // -1 represents a mine
  }

  // Calculate adjacent mine counts
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (minefield[y][x].value !== -1) {
        minefield[y][x].value = countAdjacentMines(minefield, x, y);
      }
    }
  }

  return minefield;
}

/**
 * Count adjacent mines for a cell
 */
function countAdjacentMines(minefield: Minefield, x: number, y: number): CellValue {
  const size = minefield.length;
  let count = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;

      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        if (minefield[ny][nx].value === -1) {
          count++;
        }
      }
    }
  }

  return count as CellValue;
}

// ============================================================================
// GAME ACTIONS
// ============================================================================

/**
 * Reveal a cell and recursively reveal adjacent empty cells
 * Returns a new minefield without mutating the original
 *
 * When a cell is revealed:
 * - If it's a mine, game ends (hitMine = true)
 * - If it's empty (0), all adjacent cells are revealed recursively
 * - If it's a number, only that cell is revealed
 * - Returns the new minefield state and game status
 *
 * @param minefield - The current minefield state
 * @param x - X coordinate of the cell to reveal
 * @param y - Y coordinate of the cell to reveal
 * @returns Object containing the new minefield, whether a mine was hit, and number of cells revealed
 *
 * @example
 * // Reveal a cell at position (5, 5)
 * const result = revealCell(minefield, 5, 5);
 * if (result.hitMine) {
 *   // Game over - player hit a mine
 * } else {
 *   // Continue playing
 *   console.log(`Revealed ${result.revealed} cells`);
 * }
 */
export function revealCell(
  minefield: Minefield,
  x: number,
  y: number
): { minefield: Minefield; hitMine: boolean; revealed: number } {
  // Deep clone the minefield
  const newField = cloneMinefield(minefield);
  let revealedCount = 0;
  let hitMine = false;

  const reveal = (cx: number, cy: number): void => {
    const cell = newField[cy]?.[cx];
    if (!cell || cell.state !== 'hidden') return;

    cell.state = 'revealed';
    revealedCount++;

    if (cell.value === -1) {
      hitMine = true;
      return;
    }

    // Auto-reveal adjacent cells if this is a zero
    if (cell.value === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          reveal(cx + dx, cy + dy);
        }
      }
    }
  };

  reveal(x, y);

  return { minefield: newField, hitMine, revealed: revealedCount };
}

/**
 * Toggle flag on a cell (hidden ↔ flagged)
 * Returns a new minefield without mutating the original
 *
 * This function allows players to mark cells as suspected mines by placing flags.
 * Flags can be removed by clicking again on a flagged cell.
 *
 * @param minefield - The current minefield state
 * @param x - X coordinate of the cell to toggle
 * @param y - Y coordinate of the cell to toggle
 * @returns A new minefield with the flag toggled
 *
 * @example
 * // Toggle flag on cell (3, 3)
 * const newMinefield = toggleFlag(minefield, 3, 3);
 * // If cell was hidden, it's now flagged
 * // If cell was flagged, it's now hidden
 */
export function toggleFlag(minefield: Minefield, x: number, y: number): Minefield {
  const newField = cloneMinefield(minefield);
  const cell = newField[y]?.[x];

  if (!cell) return minefield;
  if (cell.state === 'revealed') return minefield;

  cell.state = cell.state === 'flagged' ? 'hidden' : 'flagged';

  return newField;
}

/**
 * Mark all mines as revealed (when game ends)
 */
export function revealAllMines(minefield: Minefield): Minefield {
  const newField = cloneMinefield(minefield);

  for (let y = 0; y < newField.length; y++) {
    for (let x = 0; x < newField[y].length; x++) {
      const cell = newField[y][x];
      if (cell.value === -1 && cell.state !== 'flagged') {
        cell.state = 'revealed';
      }
      if (cell.value !== -1 && cell.state === 'flagged') {
        // Wrong flag - keep it visible
        cell.state = 'flagged';
      }
    }
  }

  return newField;
}

// ============================================================================
// GAME STATE QUERIES
// ============================================================================

/**
 * Check if the player has won (all non-mine cells revealed)
 */
export function checkWin(minefield: Minefield): boolean {
  const { TOTAL_MINES, TOTAL_CELLS } = GAME_CONFIG;
  let revealedCount = 0;

  for (const row of minefield) {
    for (const cell of row) {
      if (cell.state === 'revealed' && cell.value !== -1) {
        revealedCount++;
      }
    }
  }

  return revealedCount === TOTAL_CELLS - TOTAL_MINES;
}

/**
 * Check if the player has lost (hit a mine)
 */
export function checkLoss(minefield: Minefield): boolean {
  for (const row of minefield) {
    for (const cell of row) {
      if (cell.state === 'revealed' && cell.value === -1) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get the position of the exploded mine
 */
export function getExplodedMine(minefield: Minefield): { x: number; y: number } | null {
  for (let y = 0; y < minefield.length; y++) {
    for (let x = 0; x < minefield[y].length; x++) {
      const cell = minefield[y][x];
      if (cell.state === 'revealed' && cell.value === -1) {
        return { x, y };
      }
    }
  }
  return null;
}

/**
 * Count cells by state
 */
export function countCells(minefield: Minefield, state: CellState): number {
  let count = 0;
  for (const row of minefield) {
    for (const cell of row) {
      if (cell.state === state) count++;
    }
  }
  return count;
}

/**
 * Count correctly and incorrectly flagged cells
 */
export function countFlags(minefield: Minefield): { correct: number; wrong: number } {
  let correct = 0;
  let wrong = 0;

  for (const row of minefield) {
    for (const cell of row) {
      if (cell.state === 'flagged') {
        if (cell.value === -1) {
          correct++;
        } else {
          wrong++;
        }
      }
    }
  }

  return { correct, wrong };
}

// ============================================================================
// SCORING
// ============================================================================

/**
 * Calculate score based on game performance
 * Matches the RISC Zero guest program scoring algorithm
 *
 * The scoring system is designed to reward:
 * - Revealing safe cells (higher percentage = more points)
 * - Correctly flagging mines (higher percentage = more points)
 * - Penalizing wrong flag placements
 *
 * Score Formula:
 * - Revealed Points: (revealedSafeCells / totalSafeCells) * PER_REVEALED_PERCENT
 * - Flagged Points: (correctFlags / totalMines) * PER_FLAGGED_PERCENT
 * - Wrong Flag Penalty: wrongFlags * WRONG_FLAG_PENALTY
 * - Total Score = Revealed Points + Flagged Points - Wrong Flag Penalty
 * - Final score is clamped between 0 and MAX_SCORE
 *
 * @param minefield - The completed minefield state
 * @returns The calculated score (0-1000)
 *
 * @example
 * // Calculate score for a completed game
 * const score = calculateScore(finalMinefield);
 * console.log(`Player scored ${score} points`);
 */
export function calculateScore(minefield: Minefield): number {
  const { TOTAL_CELLS, TOTAL_MINES, SCORING } = GAME_CONFIG;

  const revealedCount = countCells(minefield, 'revealed');
  const flags = countFlags(minefield);

  // Calculate percentages (excluding mines from total)
  const safeCells = TOTAL_CELLS - TOTAL_MINES;
  const revealedPercent = (revealedCount / safeCells) * 100;
  const flaggedPercent = (flags.correct / TOTAL_MINES) * 100;

  // Calculate score
  const revealedPoints = Math.floor(revealedPercent * SCORING.PER_REVEALED_PERCENT);
  const flaggedPoints = Math.floor(flaggedPercent * SCORING.PER_FLAGGED_PERCENT);
  const wrongFlagPenalty = flags.wrong * SCORING.WRONG_FLAG_PENALTY;

  let totalScore = revealedPoints + flaggedPoints - wrongFlagPenalty;

  // Clamp score between 0 and MAX_SCORE
  totalScore = Math.max(0, Math.min(totalScore, GAME_CONFIG.MAX_SCORE));

  return totalScore;
}

/**
 * Get detailed score breakdown
 */
export function getScoreBreakdown(minefield: Minefield) {
  const { TOTAL_CELLS, TOTAL_MINES, SCORING } = GAME_CONFIG;

  const revealedCount = countCells(minefield, 'revealed');
  const flags = countFlags(minefield);

  const safeCells = TOTAL_CELLS - TOTAL_MINES;
  const revealedPercent = (revealedCount / safeCells) * 100;
  const flaggedPercent = (flags.correct / TOTAL_MINES) * 100;

  const revealedPoints = Math.floor(revealedPercent * SCORING.PER_REVEALED_PERCENT);
  const flaggedPoints = Math.floor(flaggedPercent * SCORING.PER_FLAGGED_PERCENT);
  const wrongFlagPenalty = flags.wrong * SCORING.WRONG_FLAG_PENALTY;

  const totalScore = Math.max(
    0,
    Math.min(revealedPoints + flaggedPoints - wrongFlagPenalty, GAME_CONFIG.MAX_SCORE)
  );

  return {
    revealedPercent: Math.round(revealedPercent),
    revealedPoints,
    flaggedPercent: Math.round(flaggedPercent),
    flaggedPoints,
    wrongFlagPenalty,
    totalScore,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Deep clone a minefield
 */
export function cloneMinefield(minefield: Minefield): Minefield {
  return minefield.map(row =>
    row.map(cell => ({ ...cell }))
  );
}

/**
 * Create an empty minefield (all hidden, value 0)
 */
export function createEmptyMinefield(): Minefield {
  const { GRID_SIZE } = GAME_CONFIG;
  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x): Cell => ({
      x,
      y,
      value: 0,
      state: 'hidden',
    }))
  );
}

/**
 * Validate a move is within bounds
 */
export function isValidMove(x: number, y: number): boolean {
  const { GRID_SIZE } = GAME_CONFIG;
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

/**
 * Check if a cell can be revealed
 */
export function canReveal(minefield: Minefield, x: number, y: number): boolean {
  if (!isValidMove(x, y)) return false;
  const cell = minefield[y][x];
  return cell.state === 'hidden';
}

/**
 * Check if a cell can be flagged
 */
export function canFlag(minefield: Minefield, x: number, y: number): boolean {
  if (!isValidMove(x, y)) return false;
  const cell = minefield[y][x];
  return cell.state === 'hidden' || cell.state === 'flagged';
}

// ============================================================================
// HINT SYSTEM (uses isSafe property)
// ============================================================================

/**
 * Get a hint - find a safe cell that hasn't been revealed
 *
 * The hint algorithm prioritizes:
 * 1. Cells with 0 adjacent mines (guaranteed safe)
 * 2. Any other safe cell (non-mine)
 *
 * This function is used when players use hint tokens, giving them a safe
 * cell to reveal. Hints are limited to 3 per game.
 *
 * @param minefield - The current minefield state
 * @returns Coordinates of a safe cell to reveal, or null if no hints available
 *
 * @example
 * // Get a hint for the current minefield
 * const hint = getHint(minefield);
 * if (hint) {
 *   console.log(`Try revealing cell (${hint.x}, ${hint.y})`);
 * }
 */
export function getHint(minefield: Minefield): { x: number; y: number } | null {
  const { GRID_SIZE } = GAME_CONFIG;

  // First, try to find a cell with 0 adjacent mines
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = minefield[y][x];
      if (cell.state === 'hidden' && cell.value === 0) {
        return { x, y };
      }
    }
  }

  // Then try any safe cell
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = minefield[y][x];
      if (cell.state === 'hidden' && cell.value !== -1) {
        return { x, y };
      }
    }
  }

  return null;
}

/**
 * Mark safe cells (for hint display)
 */
export function markSafeCells(minefield: Minefield): Minefield {
  const newField = cloneMinefield(minefield);

  for (let y = 0; y < newField.length; y++) {
    for (let x = 0; x < newField[y].length; x++) {
      const cell = newField[y][x];
      if (cell.state === 'hidden' && cell.value !== -1) {
        cell.isSafe = true;
      }
    }
  }

  return newField;
}
