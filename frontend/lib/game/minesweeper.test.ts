/**
 * Tests for Minesweeper Core Game Logic
 * TDD Approach: Write failing tests first, then implement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMinefield,
  revealCell,
  toggleFlag,
  revealAllMines,
  checkWin,
  checkLoss,
  getExplodedMine,
  countCells,
  countFlags,
  calculateScore,
  getScoreBreakdown,
  cloneMinefield,
  createEmptyMinefield,
  isValidMove,
  canReveal,
  canFlag,
  getHint,
  markSafeCells,
} from './minesweeper';
import { GAME_CONFIG } from './types';
import type { Minefield, Cell } from './types';

describe('SeededRandom - Deterministic Minefield Generation', () => {
  it('should generate the same minefield for the same seed', () => {
    const seed1 = 'test-seed-123';
    const minefield1 = generateMinefield(seed1);
    const minefield2 = generateMinefield(seed1);

    // Deep comparison of all cells
    expect(minefield1).toHaveLength(GAME_CONFIG.GRID_SIZE);
    expect(minefield2).toHaveLength(GAME_CONFIG.GRID_SIZE);

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        expect(minefield1[y][x].value).toEqual(minefield2[y][x].value);
        expect(minefield1[y][x].x).toEqual(minefield2[y][x].x);
        expect(minefield1[y][x].y).toEqual(minefield2[y][x].y);
      }
    }
  });

  it('should generate different minefields for different seeds', () => {
    const minefield1 = generateMinefield('seed-1');
    const minefield2 = generateMinefield('seed-2');

    // At least some cells should be different
    let hasDifference = false;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield1[y][x].value !== minefield2[y][x].value) {
          hasDifference = true;
          break;
        }
      }
    }
    expect(hasDifference).toBe(true);
  });

  it('should place exactly TOTAL_MINES mines', () => {
    const minefield = generateMinefield('test-seed');
    let mineCount = 0;

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value === -1) {
          mineCount++;
        }
      }
    }

    expect(mineCount).toEqual(GAME_CONFIG.TOTAL_MINES);
  });

  it('should calculate adjacent mine counts correctly', () => {
    // Create a manual minefield with known mine positions
    const minefield: Minefield = Array.from({ length: GAME_CONFIG.GRID_SIZE }, (_, y) =>
      Array.from({ length: GAME_CONFIG.GRID_SIZE }, (_, x): Cell => ({
        x,
        y,
        value: 0,
        state: 'hidden',
      }))
    );

    // Place a mine at (3, 3)
    minefield[3][3].value = -1;

    // Place a mine at (4, 4)
    minefield[4][4].value = -1;

    // Recalculate counts
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < GAME_CONFIG.GRID_SIZE && ny >= 0 && ny < GAME_CONFIG.GRID_SIZE) {
                if (minefield[ny][nx].value === -1) count++;
              }
            }
          }
          minefield[y][x].value = count as any;
        }
      }
    }

    // Cell (2, 2) should have 2 adjacent mines (at 3,3 and 4,4)
    expect(minefield[2][2].value).toEqual(2);

    // Cell (3, 4) should have 2 adjacent mines
    expect(minefield[3][4].value).toEqual(2);

    // Cell (0, 0) should have 0 adjacent mines
    expect(minefield[0][0].value).toEqual(0);
  });
});

describe('revealCell', () => {
  let minefield: Minefield;

  beforeEach(() => {
    minefield = generateMinefield('test-reveal');
  });

  it('should reveal a single safe cell', () => {
    // Find a safe cell (value >= 0)
    let safeX = -1, safeY = -1;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value >= 1) {
          safeX = x;
          safeY = y;
          break;
        }
      }
      if (safeX >= 0) break;
    }

    const result = revealCell(minefield, safeX, safeY);

    expect(result.hitMine).toBe(false);
    expect(result.minefield[safeY][safeX].state).toEqual('revealed');
    expect(result.revealed).toBeGreaterThanOrEqual(1);
  });

  it('should cascade reveal zeros', () => {
    // Create a simple minefield with zeros
    const simpleField: Minefield = Array.from({ length: 5 }, (_, y) =>
      Array.from({ length: 5 }, (_, x): Cell => ({
        x,
        y,
        value: 0,
        state: 'hidden',
      }))
    );

    // Place mines in corner
    simpleField[0][0].value = -1;
    simpleField[0][1].value = 1;

    const result = revealCell(simpleField, 4, 4);

    // Should reveal many cells due to cascade
    expect(result.revealed).toBeGreaterThan(1);
    expect(result.hitMine).toBe(false);
  });

  it('should detect mine hit', () => {
    // Find a mine
    let mineX = -1, mineY = -1;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value === -1) {
          mineX = x;
          mineY = y;
          break;
        }
      }
      if (mineX >= 0) break;
    }

    const result = revealCell(minefield, mineX, mineY);

    expect(result.hitMine).toBe(true);
    expect(result.minefield[mineY][mineX].state).toEqual('revealed');
  });

  it('should not mutate original minefield', () => {
    const originalState = minefield[0][0].state;

    revealCell(minefield, 0, 0);

    // Original should be unchanged
    expect(minefield[0][0].state).toEqual(originalState);
  });

  it('should handle out of bounds gracefully', () => {
    const result = revealCell(minefield, -1, -1);

    expect(result.hitMine).toBe(false);
    expect(result.revealed).toEqual(0);
  });

  it('should not reveal already revealed cells', () => {
    // First reveal
    let result1 = revealCell(minefield, 0, 0);
    const revealedCount = result1.revealed;

    // Try to reveal same cell again
    let result2 = revealCell(result1.minefield, 0, 0);

    // Count should not increase
    expect(result2.revealed).toEqual(revealedCount);
  });
});

describe('toggleFlag', () => {
  let minefield: Minefield;

  beforeEach(() => {
    minefield = generateMinefield('test-flag');
  });

  it('should flag a hidden cell', () => {
    const result = toggleFlag(minefield, 0, 0);

    expect(result[0][0].state).toEqual('flagged');
  });

  it('should unflag a flagged cell', () => {
    let result = toggleFlag(minefield, 0, 0);
    expect(result[0][0].state).toEqual('flagged');

    result = toggleFlag(result, 0, 0);
    expect(result[0][0].state).toEqual('hidden');
  });

  it('should not flag a revealed cell', () => {
    let revealed = revealCell(minefield, 0, 0);
    const result = toggleFlag(revealed.minefield, 0, 0);

    expect(result[0][0].state).toEqual('revealed');
  });

  it('should not mutate original minefield', () => {
    const originalState = minefield[0][0].state;

    toggleFlag(minefield, 0, 0);

    expect(minefield[0][0].state).toEqual(originalState);
  });

  it('should handle out of bounds gracefully', () => {
    const result = toggleFlag(minefield, -1, -1);

    expect(result).toEqual(minefield);
  });
});

describe('revealAllMines', () => {
  it('should reveal all mines when game is lost', () => {
    const minefield = generateMinefield('test-reveal-all');
    const result = revealAllMines(minefield);

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value === -1 && result[y][x].state !== 'flagged') {
          expect(result[y][x].state).toEqual('revealed');
        }
      }
    }
  });

  it('should keep flagged mines as flagged', () => {
    const minefield = generateMinefield('test-keep-flags');

    // Flag some cells
    let field = toggleFlag(minefield, 0, 0);
    field = toggleFlag(field, 1, 1);

    const result = revealAllMines(field);

    // Check that flags are preserved
    expect(result[0][0].state).toEqual('flagged');
    expect(result[1][1].state).toEqual('flagged');
  });
});

describe('checkWin', () => {
  it('should return false when game starts', () => {
    const minefield = generateMinefield('test-win');
    expect(checkWin(minefield)).toBe(false);
  });

  it('should return true when all non-mine cells are revealed', () => {
    const minefield = generateMinefield('test-win-complete');

    // Reveal all non-mine cells
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1) {
          minefield[y][x].state = 'revealed';
        }
      }
    }

    expect(checkWin(minefield)).toBe(true);
  });

  it('should return false when some non-mine cells are still hidden', () => {
    const minefield = generateMinefield('test-not-won');

    // Reveal only half of non-mine cells
    let revealed = 0;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1 && revealed < 20) {
          minefield[y][x].state = 'revealed';
          revealed++;
        }
      }
    }

    expect(checkWin(minefield)).toBe(false);
  });
});

describe('checkLoss', () => {
  it('should return false when no mine is revealed', () => {
    const minefield = generateMinefield('test-no-loss');
    expect(checkLoss(minefield)).toBe(false);
  });

  it('should return true when a mine is revealed', () => {
    const minefield = generateMinefield('test-loss');

    // Find and reveal a mine
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value === -1) {
          minefield[y][x].state = 'revealed';
          break;
        }
      }
    }

    expect(checkLoss(minefield)).toBe(true);
  });
});

describe('getExplodedMine', () => {
  it('should return null when no mine exploded', () => {
    const minefield = generateMinefield('test-no-explode');
    expect(getExplodedMine(minefield)).toBeNull();
  });

  it('should return position of exploded mine', () => {
    const minefield = generateMinefield('test-explode');

    // Reveal a mine
    minefield[2][2].value = -1;
    minefield[2][2].state = 'revealed';

    const result = getExplodedMine(minefield);
    expect(result).toEqual({ x: 2, y: 2 });
  });
});

describe('countCells', () => {
  it('should count hidden cells', () => {
    const minefield = generateMinefield('test-count-hidden');
    const count = countCells(minefield, 'hidden');

    expect(count).toEqual(GAME_CONFIG.TOTAL_CELLS);
  });

  it('should count revealed cells', () => {
    const minefield = generateMinefield('test-count-revealed');

    // Reveal some cells
    minefield[0][0].state = 'revealed';
    minefield[0][1].state = 'revealed';
    minefield[0][2].state = 'revealed';

    const count = countCells(minefield, 'revealed');
    expect(count).toEqual(3);
  });

  it('should count flagged cells', () => {
    const minefield = generateMinefield('test-count-flagged');

    minefield[0][0].state = 'flagged';
    minefield[1][1].state = 'flagged';

    const count = countCells(minefield, 'flagged');
    expect(count).toEqual(2);
  });
});

describe('countFlags', () => {
  it('should count correct and wrong flags', () => {
    const minefield = generateMinefield('test-count-flags');

    // Flag a mine (correct)
    let mineX = -1, mineY = -1;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value === -1) {
          mineX = x;
          mineY = y;
          break;
        }
      }
      if (mineX >= 0) break;
    }
    minefield[mineY][mineX].state = 'flagged';

    // Flag a safe cell (wrong)
    minefield[0][0].state = 'flagged';

    const result = countFlags(minefield);

    expect(result.correct).toEqual(1);
    expect(result.wrong).toEqual(1);
  });

  it('should return zeros when no flags', () => {
    const minefield = generateMinefield('test-no-flags');
    const result = countFlags(minefield);

    expect(result.correct).toEqual(0);
    expect(result.wrong).toEqual(0);
  });
});

describe('calculateScore', () => {
  it('should return 0 for empty minefield', () => {
    const minefield = createEmptyMinefield();
    const score = calculateScore(minefield);

    expect(score).toEqual(0);
  });

  it('should calculate score for partially revealed field', () => {
    const minefield = generateMinefield('test-score-partial');

    // Reveal 20 safe cells
    let revealed = 0;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1 && revealed < 20) {
          minefield[y][x].state = 'revealed';
          revealed++;
        }
      }
    }

    const score = calculateScore(minefield);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(GAME_CONFIG.MAX_SCORE);
  });

  it('should calculate maximum score for winning game', () => {
    const minefield = generateMinefield('test-score-max');

    // Reveal all non-mine cells
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1) {
          minefield[y][x].state = 'revealed';
        }
      }
    }

    const score = calculateScore(minefield);

    // Max score should be close to GAME_CONFIG.MAX_SCORE
    // (might not be exact due to rounding)
    expect(score).toBeGreaterThan(GAME_CONFIG.MAX_SCORE * 0.9);
  });

  it('should apply wrong flag penalty', () => {
    const minefield = generateMinefield('test-score-penalty');

    // Reveal some cells
    let revealed = 0;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1 && revealed < 20) {
          minefield[y][x].state = 'revealed';
          revealed++;
        }
      }
    }

    const scoreWithoutPenalty = calculateScore(minefield);

    // Add wrong flags
    minefield[0][0].state = 'flagged';
    minefield[0][1].state = 'flagged';
    minefield[0][2].state = 'flagged';

    const scoreWithPenalty = calculateScore(minefield);

    expect(scoreWithPenalty).toBeLessThan(scoreWithoutPenalty);
  });

  it('should clamp score to 0 minimum', () => {
    const minefield = generateMinefield('test-score-clamp');

    // Add many wrong flags
    for (let i = 0; i < 30; i++) {
      const x = i % GAME_CONFIG.GRID_SIZE;
      const y = Math.floor(i / GAME_CONFIG.GRID_SIZE);
      if (minefield[y][x].value !== -1) {
        minefield[y][x].state = 'flagged';
      }
    }

    const score = calculateScore(minefield);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should clamp score to MAX_SCORE maximum', () => {
    const minefield = generateMinefield('test-score-max-clamp');

    // Reveal all non-mine cells and flag all mines
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value === -1) {
          minefield[y][x].state = 'flagged';
        } else {
          minefield[y][x].state = 'revealed';
        }
      }
    }

    const score = calculateScore(minefield);
    expect(score).toBeLessThanOrEqual(GAME_CONFIG.MAX_SCORE);
  });
});

describe('getScoreBreakdown', () => {
  it('should return detailed score breakdown', () => {
    const minefield = generateMinefield('test-breakdown');

    // Reveal some cells
    let revealed = 0;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1 && revealed < 30) {
          minefield[y][x].state = 'revealed';
          revealed++;
        }
      }
    }

    const breakdown = getScoreBreakdown(minefield);

    expect(breakdown).toHaveProperty('revealedPercent');
    expect(breakdown).toHaveProperty('revealedPoints');
    expect(breakdown).toHaveProperty('flaggedPercent');
    expect(breakdown).toHaveProperty('flaggedPoints');
    expect(breakdown).toHaveProperty('wrongFlagPenalty');
    expect(breakdown).toHaveProperty('totalScore');

    expect(breakdown.totalScore).toBeGreaterThanOrEqual(0);
  });
});

describe('cloneMinefield', () => {
  it('should create a deep copy of minefield', () => {
    const minefield = generateMinefield('test-clone');
    const clone = cloneMinefield(minefield);

    // Modify clone
    clone[0][0].state = 'revealed';

    // Original should be unchanged
    expect(minefield[0][0].state).toEqual('hidden');
    expect(clone[0][0].state).toEqual('revealed');
  });

  it('should produce identical structure', () => {
    const minefield = generateMinefield('test-clone-structure');
    const clone = cloneMinefield(minefield);

    expect(clone).toHaveLength(GAME_CONFIG.GRID_SIZE);

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      expect(clone[y]).toHaveLength(GAME_CONFIG.GRID_SIZE);
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        expect(clone[y][x].value).toEqual(minefield[y][x].value);
        expect(clone[y][x].state).toEqual(minefield[y][x].state);
      }
    }
  });
});

describe('createEmptyMinefield', () => {
  it('should create minefield with all cells hidden and value 0', () => {
    const minefield = createEmptyMinefield();

    expect(minefield).toHaveLength(GAME_CONFIG.GRID_SIZE);

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      expect(minefield[y]).toHaveLength(GAME_CONFIG.GRID_SIZE);
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        expect(minefield[y][x].value).toEqual(0);
        expect(minefield[y][x].state).toEqual('hidden');
        expect(minefield[y][x].x).toEqual(x);
        expect(minefield[y][x].y).toEqual(y);
      }
    }
  });
});

describe('isValidMove', () => {
  it('should return true for valid moves', () => {
    expect(isValidMove(0, 0)).toBe(true);
    expect(isValidMove(3, 5)).toBe(true);
    expect(isValidMove(7, 7)).toBe(true);
  });

  it('should return false for out of bounds moves', () => {
    expect(isValidMove(-1, 0)).toBe(false);
    expect(isValidMove(0, -1)).toBe(false);
    expect(isValidMove(8, 0)).toBe(false);
    expect(isValidMove(0, 8)).toBe(false);
    expect(isValidMove(-1, -1)).toBe(false);
    expect(isValidMove(8, 8)).toBe(false);
  });
});

describe('canReveal', () => {
  it('should return true for hidden cells', () => {
    const minefield = createEmptyMinefield();
    expect(canReveal(minefield, 0, 0)).toBe(true);
  });

  it('should return false for revealed cells', () => {
    const minefield = createEmptyMinefield();
    minefield[0][0].state = 'revealed';

    expect(canReveal(minefield, 0, 0)).toBe(false);
  });

  it('should return false for flagged cells', () => {
    const minefield = createEmptyMinefield();
    minefield[0][0].state = 'flagged';

    expect(canReveal(minefield, 0, 0)).toBe(false);
  });

  it('should return false for out of bounds', () => {
    const minefield = createEmptyMinefield();
    expect(canReveal(minefield, -1, 0)).toBe(false);
    expect(canReveal(minefield, 8, 0)).toBe(false);
  });
});

describe('canFlag', () => {
  it('should return true for hidden cells', () => {
    const minefield = createEmptyMinefield();
    expect(canFlag(minefield, 0, 0)).toBe(true);
  });

  it('should return true for flagged cells (can unflag)', () => {
    const minefield = createEmptyMinefield();
    minefield[0][0].state = 'flagged';

    expect(canFlag(minefield, 0, 0)).toBe(true);
  });

  it('should return false for revealed cells', () => {
    const minefield = createEmptyMinefield();
    minefield[0][0].state = 'revealed';

    expect(canFlag(minefield, 0, 0)).toBe(false);
  });

  it('should return false for out of bounds', () => {
    const minefield = createEmptyMinefield();
    expect(canFlag(minefield, -1, 0)).toBe(false);
    expect(canFlag(minefield, 8, 0)).toBe(false);
  });
});

describe('getHint', () => {
  it('should return a safe hidden cell', () => {
    const minefield = generateMinefield('test-hint');
    const hint = getHint(minefield);

    expect(hint).not.toBeNull();
    expect(hint!.x).toBeGreaterThanOrEqual(0);
    expect(hint!.x).toBeLessThan(GAME_CONFIG.GRID_SIZE);
    expect(hint!.y).toBeGreaterThanOrEqual(0);
    expect(hint!.y).toBeLessThan(GAME_CONFIG.GRID_SIZE);

    // The hint should be a safe cell (not a mine)
    expect(minefield[hint!.y][hint!.x].value).not.toEqual(-1);
  });

  it('should prioritize cells with 0 adjacent mines', () => {
    const minefield = generateMinefield('test-hint-zero');

    // Find if there's a zero cell
    let hasZero = false;
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value === 0 && minefield[y][x].state === 'hidden') {
          hasZero = true;
          break;
        }
      }
      if (hasZero) break;
    }

    const hint = getHint(minefield);

    if (hasZero) {
      // If there's a zero cell, hint should point to a zero
      expect(minefield[hint!.y][hint!.x].value).toEqual(0);
    }
  });

  it('should return null when all safe cells are revealed', () => {
    const minefield = generateMinefield('test-hint-none');

    // Reveal all non-mine cells
    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        if (minefield[y][x].value !== -1) {
          minefield[y][x].state = 'revealed';
        }
      }
    }

    const hint = getHint(minefield);
    expect(hint).toBeNull();
  });

  it('should return a single cell (not all safe cells)', () => {
    const minefield = generateMinefield('test-hint-single');

    const hint = getHint(minefield);

    // Should be a single object with x, y coordinates
    expect(hint).not.toBeNull();
    expect(typeof hint!.x).toBe('number');
    expect(typeof hint!.y).toBe('number');
  });
});

describe('markSafeCells', () => {
  it('should mark all hidden safe cells', () => {
    const minefield = generateMinefield('test-mark-safe');
    const result = markSafeCells(minefield);

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        const cell = result[y][x];
        if (cell.value !== -1 && cell.state === 'hidden') {
          expect(cell.isSafe).toBe(true);
        }
      }
    }
  });

  it('should not mark mines as safe', () => {
    const minefield = generateMinefield('test-mark-not-safe');
    const result = markSafeCells(minefield);

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        const cell = result[y][x];
        if (cell.value === -1) {
          expect(cell.isSafe).toBeUndefined();
        }
      }
    }
  });

  it('should not mutate original minefield', () => {
    const minefield = generateMinefield('test-mark-no-mutate');
    markSafeCells(minefield);

    for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
        expect(minefield[y][x].isSafe).toBeUndefined();
      }
    }
  });
});

describe('Edge Cases', () => {
  it('should handle empty seed string', () => {
    const minefield = generateMinefield('');
    expect(minefield).toHaveLength(GAME_CONFIG.GRID_SIZE);
  });

  it('should handle special characters in seed', () => {
    const minefield = generateMinefield('test-🎮-seed-ñ-中文');
    expect(minefield).toHaveLength(GAME_CONFIG.GRID_SIZE);
  });

  it('should handle very long seed strings', () => {
    const longSeed = 'a'.repeat(10000);
    const minefield = generateMinefield(longSeed);
    expect(minefield).toHaveLength(GAME_CONFIG.GRID_SIZE);
  });

  it('should handle null/undefined input gracefully', () => {
    // These should not crash
    expect(() => isValidMove(NaN as any, NaN as any)).not.toThrow();
    expect(() => canReveal(null as any, 0, 0)).toThrow();
  });

  it('should handle concurrent operations (simulate race condition)', () => {
    const minefield = generateMinefield('test-race');

    // Simulate multiple operations on same minefield
    const result1 = revealCell(minefield, 0, 0);
    const result2 = revealCell(minefield, 1, 1);
    const result3 = toggleFlag(minefield, 2, 2);

    // All should return independent results
    expect(result1.minefield).not.toBe(result2.minefield);
    expect(result2.minefield).not.toBe(result3);
  });
});

describe('Performance', () => {
  it('should generate minefield quickly', () => {
    const start = Date.now();
    generateMinefield('perf-test');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });

  it('should handle large cascade reveals efficiently', () => {
    const minefield = createEmptyMinefield();
    const start = Date.now();

    // Create a cascade scenario (all zeros)
    const result = revealCell(minefield, 0, 0);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(50);
    expect(result.revealed).toBe(GAME_CONFIG.TOTAL_CELLS);
  });
});
