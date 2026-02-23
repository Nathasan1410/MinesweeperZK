# Minesweeper ZK — Scoring System

## Game Board
| Parameter | Value |
|-----------|-------|
| Grid Size | 8 × 8 (64 cells) |
| Total Mines | 10 |
| Safe Cells | 54 |
| Max Score | 1,000 |

## Score Breakdown

| Action | Formula | Max Points |
|--------|---------|-----------|
| Revealing safe cells | `(revealed / 54 safe cells) × 100 × 5` | 500 |
| Correctly flagging mines | `(correct flags / 10 mines) × 100 × 5` | 500 |
| Wrong flag penalty | `-50 per wrong flag` | — |

## Examples

| Scenario | Revealed | Correct Flags | Wrong Flags | Score |
|----------|----------|---------------|-------------|-------|
| Perfect game (100% clear + all mines flagged) | 54/54 | 10/10 | 0 | **1,000** |
| Full clear, no flags | 54/54 | 0/10 | 0 | **500** |
| Half cleared, 5 flags correct | 27/54 | 5/10 | 0 | **500** |
| Full clear, 2 wrong flags | 54/54 | 10/10 | 2 | **900** |
| Hit a mine early (10 cells) | 10/54 | 0/10 | 0 | **90** |

## Winner Determination
- Both players play the **same deterministic board** (generated from a shared seed).
- The player with the **higher score** wins the XLM prize pool.
- Scores are verified on-chain via ZK proofs — no cheating possible.
