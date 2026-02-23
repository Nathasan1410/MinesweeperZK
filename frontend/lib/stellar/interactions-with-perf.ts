/**
 * Stellar Contract Interactions with Performance Monitoring
 * Wrap existing contract interactions with performance tracking
 */

'use client';

import { contractInteractions } from './interactions';
import { measureContractDuration } from '@/lib/performance/monitor';

// ============================================================================
// WRAPPER CLASS
// ============================================================================

class ContractInteractionsWithPerf {
  /**
   * Start a new game with performance tracking
   */
  async startGame(params: {
    player1: string;
    player2: string;
    betAmount: bigint;
  }) {
    return measureContractDuration('startGame', () =>
      contractInteractions.startGame(params)
    );
  }

  /**
   * Submit score with performance tracking
   */
  async submitScore(params: {
    sessionId: number;
    playerAddress: string;
    score: number;
    moves: number;
    zkProof: import('@/lib/game/types').ZKProof;
  }) {
    return measureContractDuration('submitScore', () =>
      contractInteractions.submitScore(params)
    );
  }

  /**
   * Reveal winner with performance tracking
   */
  async revealWinner(sessionId: number) {
    return measureContractDuration('revealWinner', () =>
      contractInteractions.revealWinner(sessionId)
    );
  }

  /**
   * Claim prize with performance tracking
   */
  async claimPrize(params: {
    sessionId: number;
    winnerAddress: string;
  }) {
    return measureContractDuration('claimPrize', () =>
      contractInteractions.claimPrize(params)
    );
  }

  /**
   * Get game state with performance tracking
   */
  async getGameState(sessionId: number) {
    return measureContractDuration('getGameState', () =>
      contractInteractions.getGameState(sessionId)
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const contractInteractionsWithPerf = new ContractInteractionsWithPerf();

// Export types from original file
export type {
  GameStartParams,
  ScoreSubmissionParams,
  ClaimPrizeParams,
  TransactionResult,
} from './interactions';
