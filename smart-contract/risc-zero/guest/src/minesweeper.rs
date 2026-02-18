// RISC Zero Guest Program for Minesweeper ZK Verification
//
// This program verifies that a minesweeper game was played fairly
// by checking all moves against a known minefield generated from a seed.
//
// INPUT: seed + moves
// OUTPUT: final score + validity commitment
//
// To compile (when ready):
//   cargo install --locked risczero-zkvm
//   cargo build --release

#![no_main]
#![no_std]

extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use risc0_zkvm::guest::env;
use risc0_zkvm::sha::{Digest, Impl as Sha256};
use serde::{Deserialize, Serialize};

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/// A move made by a player
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Move {
    pub x: u8,
    pub y: u8,
    pub action: u8, // 0 = reveal, 1 = flag
}

/// Input to the verification program
#[derive(Debug, Serialize, Deserialize)]
pub struct MinesweeperInput {
    pub seed: [u8; 32],
    pub moves: Vec<Move>,
    pub grid_size: u8,
    pub total_mines: u8,
}

/// Output from the verification program
#[derive(Debug, Serialize, Deserialize)]
pub struct MinesweeperOutput {
    pub score: u32,
    pub revealed_count: u32,
    pub correct_flags: u32,
    pub wrong_flags: u32,
    pub hit_mine: bool,
    pub completion_percent: u8,
}

// ============================================================================
// MINEFIELD GENERATION
// ============================================================================

/// Represents a cell in the minefield
#[derive(Debug, Clone, Copy)]
struct Cell {
    is_mine: bool,
    adjacent_mines: u8,
    revealed: bool,
    flagged: bool,
}

struct Minefield {
    cells: Vec<Cell>,
    size: u8,
}

impl Minefield {
    fn new(size: u8) -> Self {
        let total_cells = (size as usize) * (size as usize);
        Minefield {
            cells: vec![
                Cell {
                    is_mine: false,
                    adjacent_mines: 0,
                    revealed: false,
                    flagged: false,
                };
                total_cells
            ],
            size,
        }
    }

    fn get_index(&self, x: u8, y: u8) -> usize {
        (y as usize) * (self.size as usize) + (x as usize)
    }

    fn get(&self, x: u8, y: u8) -> Option<&Cell> {
        if x >= self.size || y >= self.size {
            return None;
        }
        self.cells.get(self.get_index(x, y))
    }

    fn get_mut(&mut self, x: u8, y: u8) -> Option<&mut Cell> {
        if x >= self.size || y >= self.size {
            return None;
        }
        self.cells.get_mut(self.get_index(x, y))
    }

    /// Generate minefield from seed using a simple PRNG
    fn from_seed(seed: [u8; 32], size: u8, total_mines: u8) -> Self {
        let mut field = Self::new(size);

        // Simple LCG for mine placement (deterministic)
        let mut state = u32::from_le_bytes([seed[0], seed[1], seed[2], seed[3]]);
        let mines_remaining = total_mines;
        let mut placed = 0;

        while placed < mines_remaining {
            // Generate next position
            state = state.wrapping_mul(1103515245).wrapping_add(12345);
            let x = (state % (size as u32)) as u8;
            state = state.wrapping_mul(1103515245).wrapping_add(12345);
            let y = (state % (size as u32)) as u8;

            if let Some(cell) = field.get_mut(x, y) {
                if !cell.is_mine {
                    cell.is_mine = true;
                    placed += 1;
                }
            }
        }

        // Calculate adjacent mines for each cell
        for y in 0..size {
            for x in 0..size {
                if !field.get(x, y).unwrap().is_mine {
                    let adjacent = field.count_adjacent_mines(x, y);
                    field.get_mut(x, y).unwrap().adjacent_mines = adjacent;
                }
            }
        }

        field
    }

    fn count_adjacent_mines(&self, x: u8, y: u8) -> u8 {
        let mut count = 0;
        for dy in -1i8..=1 {
            for dx in -1i8..=1 {
                if dx == 0 && dy == 0 {
                    continue;
                }
                let nx = x as i8 + dx;
                let ny = y as i8 + dy;
                if nx >= 0 && ny >= 0 {
                    if let Some(cell) = self.get(nx as u8, ny as u8) {
                        if cell.is_mine {
                            count += 1;
                        }
                    }
                }
            }
        }
        count
    }
}

// ============================================================================
// GAME LOGIC
// ============================================================================

/// Verify a sequence of moves against a minefield
fn verify_moves(field: &mut Minefield, moves: &[Move]) -> MinesweeperOutput {
    let mut revealed_count = 0;
    let mut correct_flags = 0;
    let mut wrong_flags = 0;
    let mut hit_mine = false;
    let total_cells = (field.size as u32) * (field.size as u32);

    for game_move in moves {
        let (x, y) = (game_move.x, game_move.y);

        match game_move.action {
            0 => {
                // Reveal action
                if let Some(cell) = field.get_mut(x, y) {
                    if cell.is_mine {
                        hit_mine = true;
                        // Game ends on mine hit
                        break;
                    } else if !cell.revealed && !cell.flagged {
                        cell.revealed = true;
                        revealed_count += 1;
                        // Auto-reveal adjacent cells if this is a zero
                        if cell.adjacent_mines == 0 {
                            revealed_count += reveal_zeros(field, x, y);
                        }
                    }
                }
            }
            1 => {
                // Flag action
                if let Some(cell) = field.get_mut(x, y) {
                    if !cell.revealed && !cell.flagged {
                        cell.flagged = true;
                        if cell.is_mine {
                            correct_flags += 1;
                        } else {
                            wrong_flags += 1;
                        }
                    }
                }
            }
            _ => continue,
        }
    }

    // Calculate score
    let completion_percent = if total_cells > 0 {
        ((revealed_count as u32) * 100 / total_cells) as u8
    } else {
        0
    };

    let revealed_points = (completion_percent as u32) * 5; // 5 points per percent
    let flagged_mines = correct_flags as u32;
    let flagged_points = if flagged_mines > 0 {
        ((flagged_mines * 100) / (total_cells)) * 5 // Approximate percent based
    } else {
        0
    };
    let penalty = wrong_flags * 50;

    let score = if hit_mine {
        0 // No score if hit a mine
    } else {
        revealed_points.saturating_add(flagged_points).saturating_sub(penalty)
    };

    MinesweeperOutput {
        score: score.min(1000), // Cap at 1000
        revealed_count,
        correct_flags,
        wrong_flags,
        hit_mine,
        completion_percent,
    }
}

/// Auto-reveal connected zero cells (flood fill)
fn reveal_zeros(field: &mut Minefield, x: u8, y: u8) -> u32 {
    let mut count = 0;
    let mut stack = vec![(x, y)];
    let mut visited = [false; 64]; // 8x8 max

    while let Some((cx, cy)) = stack.pop() {
        let idx = (cy as usize) * (field.size as usize) + (cx as usize);
        if visited[idx] {
            continue;
        }
        visited[idx] = true;

        if let Some(cell) = field.get_mut(cx, cy) {
            if !cell.is_mine && !cell.revealed && !cell.flagged {
                cell.revealed = true;
                count += 1;

                // If this is also a zero, add neighbors
                if cell.adjacent_mines == 0 {
                    for dy in -1i8..=1 {
                        for dx in -1i8..=1 {
                            if dx == 0 && dy == 0 {
                                continue;
                            }
                            let nx = cx as i8 + dx;
                            let ny = cy as i8 + dy;
                            if nx >= 0 && ny >= 0 && nx < field.size as i8 && ny < field.size as i8 {
                                stack.push((nx as u8, ny as u8));
                            }
                        }
                    }
                }
            }
        }
    }

    count
}

// ============================================================================
// ENTRY POINT
// ============================================================================

#[no_mangle]
pub extern "C" fn main() {
    // Read input from host
    let input: MinesweeperInput = env::read();

    // Generate minefield from seed
    let mut field = Minefield::from_seed(input.seed, input.grid_size, input.total_mines);

    // Verify all moves
    let output = verify_moves(&mut field, &input.moves);

    // Commit to the output (this creates the ZK proof)
    env::commit(&output);
}

// ============================================================================
// TESTING (for development)
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_minefield_generation() {
        let seed = [0u8; 32];
        let field = Minefield::from_seed(seed, 8, 10);

        let mut mine_count = 0;
        for y in 0..8 {
            for x in 0..8 {
                if let Some(cell) = field.get(x, y) {
                    if cell.is_mine {
                        mine_count += 1;
                    }
                }
            }
        }
        assert_eq!(mine_count, 10);
    }

    #[test]
    fn test_safe_move() {
        let seed = [0u8; 32];
        let mut field = Minefield::from_seed(seed, 8, 10);
        let moves = vec![Move { x: 0, y: 0, action: 0 }];

        let output = verify_moves(&mut field, &moves);
        assert!(!output.hit_mine);
        assert!(output.revealed_count > 0);
    }

    #[test]
    fn test_flag_mine() {
        let seed = [0u8; 32];
        let mut field = Minefield::from_seed(seed, 8, 10);

        // Find a mine
        let mut mine_pos = None;
        for y in 0..8 {
            for x in 0..8 {
                if let Some(cell) = field.get(x, y) {
                    if cell.is_mine {
                        mine_pos = Some((x, y));
                        break;
                    }
                }
            }
            if mine_pos.is_some() {
                break;
            }
        }

        if let Some((x, y)) = mine_pos {
            let moves = vec![Move { x, y, action: 1 }];
            let output = verify_moves(&mut field, &moves);
            assert!(output.correct_flags > 0);
        }
    }
}
