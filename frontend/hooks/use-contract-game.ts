/**
 * Contract Game Hook
 * React hook for smart contract game interactions
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { contractInteractions, TransactionResult } from '@/lib/stellar/interactions';
import { ZKProof } from '@/lib/game/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseStartGameParams {
  player1: string;
  player2: string;
  betAmount: number;
}

export interface UseSubmitScoreParams {
  sessionId: number;
  playerAddress: string;
  score: number;
  moves: number;
  zkProof: ZKProof;
}

// ============================================================================
// HOOK: START GAME
// ============================================================================

/**
 * Hook for starting a new game on the contract
 */
export function useStartGame() {
  const [isStarting, setIsStarting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const startGame = useCallback(async (params: UseStartGameParams): Promise<boolean> => {
    setIsStarting(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await contractInteractions.startGame({
        player1: params.player1,
        player2: params.player2,
        betAmount: BigInt(params.betAmount),
      });

      if (result.status === 'success') {
        setTxHash(result.hash);
        setIsStarting(false);
        return true;
      } else {
        setError(new Error(result.error ?? 'Transaction failed'));
        setIsStarting(false);
        return false;
      }
    } catch (err) {
      setError(err as Error);
      setIsStarting(false);
      return false;
    }
  }, []);

  return {
    startGame,
    isStarting,
    txHash,
    error,
  };
}

// ============================================================================
// HOOK: SUBMIT SCORE
// ============================================================================

/**
 * Hook for submitting score to the contract
 */
export function useSubmitScore() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const submitScore = useCallback(async (params: UseSubmitScoreParams): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await contractInteractions.submitScore({
        sessionId: params.sessionId,
        playerAddress: params.playerAddress,
        score: params.score,
        moves: params.moves,
        zkProof: params.zkProof,
      });

      if (result.status === 'success') {
        setTxHash(result.hash);
        setIsSubmitting(false);
        return true;
      } else {
        setError(new Error(result.error ?? 'Transaction failed'));
        setIsSubmitting(false);
        return false;
      }
    } catch (err) {
      setError(err as Error);
      setIsSubmitting(false);
      return false;
    }
  }, []);

  return {
    submitScore,
    isSubmitting,
    txHash,
    error,
  };
}

// ============================================================================
// HOOK: REVEAL WINNER
// ============================================================================

/**
 * Hook for revealing the winner on the contract
 */
export function useRevealWinner() {
  const [isRevealing, setIsRevealing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const revealWinner = useCallback(async (sessionId: number): Promise<boolean> => {
    setIsRevealing(true);
    setError(null);
    setTxHash(null);
    setWinner(null);

    try {
      const result = await contractInteractions.revealWinner(sessionId);

      if (result.status === 'success') {
        setTxHash(result.hash);
        // TODO: Parse winner from result
        setIsRevealing(false);
        return true;
      } else {
        setError(new Error(result.error ?? 'Transaction failed'));
        setIsRevealing(false);
        return false;
      }
    } catch (err) {
      setError(err as Error);
      setIsRevealing(false);
      return false;
    }
  }, []);

  return {
    revealWinner,
    isRevealing,
    txHash,
    winner,
    error,
  };
}

// ============================================================================
// HOOK: CLAIM PRIZE
// ============================================================================

/**
 * Hook for claiming prize after winning
 * The winner calls this to withdraw their winnings from the contract
 */
export function useClaimPrize() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const claimPrize = useCallback(async (sessionId: number, winnerAddress: string): Promise<boolean> => {
    setIsClaiming(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await contractInteractions.claimPrize({
        sessionId,
        winnerAddress,
      });

      if (result.status === 'success') {
        setTxHash(result.hash);
        setIsClaiming(false);
        return true;
      } else {
        setError(new Error(result.error ?? 'Transaction failed'));
        setIsClaiming(false);
        return false;
      }
    } catch (err) {
      setError(err as Error);
      setIsClaiming(false);
      return false;
    }
  }, []);

  return {
    claimPrize,
    isClaiming,
    txHash,
    error,
  };
}

// ============================================================================
// HOOK: GAME STATE
// ============================================================================

/**
 * Hook for fetching game state from contract
 */
export function useGameState(sessionId: number | null) {
  const [state, setState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchState = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const gameState = await contractInteractions.getGameState(sessionId);
      setState(gameState);
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    state,
    isLoading,
    error,
    fetchState,
  };
}

// ============================================================================
// HOOK: TRANSACTION TRACKER
// ============================================================================

/**
 * Hook for tracking transaction status
 */
export function useTransactionTracker(initialHash: string | null = null) {
  const [txHash, setTxHash] = useState<string | null>(initialHash);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isChecking, setIsChecking] = useState(false);
  const error = useRef<Error | null>(null);

  const trackTransaction = useCallback((hash: string) => {
    setTxHash(hash);
    setStatus('pending');
  }, []);

  const checkStatus = useCallback(async () => {
    if (!txHash) {
      return;
    }

    setIsChecking(true);

    try {
      // TODO: Implement actual transaction status check via RPC
      // For now, assume success after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus('success');
      setIsChecking(false);
    } catch (err) {
      error.current = err as Error;
      setStatus('failed');
      setIsChecking(false);
    }
  }, [txHash]);

  return {
    txHash,
    status,
    isChecking,
    trackTransaction,
    checkStatus,
  };
}

// ============================================================================
// HOOK: COMPLETE GAME FLOW
// ============================================================================

/**
 * Hook that manages the complete game flow from start to prize claim
 */
export function useContractGameFlow() {
  const startGame = useStartGame();
  const submitScore = useSubmitScore();
  const revealWinner = useRevealWinner();

  const [currentStep, setCurrentStep] = useState<
    'idle' | 'starting' | 'playing' | 'submitting' | 'revealing' | 'complete' | 'error'
  >('idle');

  const flowError = useRef<Error | null>(null);

  const executeGameFlow = useCallback(async (params: {
    player1: string;
    player2: string;
    betAmount: number;
    onGameStart?: (txHash: string) => void;
    onScoreSubmit?: (txHash: string) => void;
    onWinnerReveal?: (txHash: string) => void;
  }) => {
    try {
      // Step 1: Start game
      setCurrentStep('starting');
      const started = await startGame.startGame({
        player1: params.player1,
        player2: params.player2,
        betAmount: params.betAmount,
      });

      if (!started) {
        throw new Error(startGame.error?.message ?? 'Failed to start game');
      }

      params.onGameStart?.(startGame.txHash ?? '');
      setCurrentStep('playing');

      return {
        success: true,
        step: 'playing',
        txHash: startGame.txHash,
      };
    } catch (err) {
      flowError.current = err as Error;
      setCurrentStep('error');
      return {
        success: false,
        error: err as Error,
      };
    }
  }, [startGame]);

  const submitGameScore = useCallback(async (params: UseSubmitScoreParams) => {
    try {
      setCurrentStep('submitting');
      const submitted = await submitScore.submitScore(params);

      if (!submitted) {
        throw new Error(submitScore.error?.message ?? 'Failed to submit score');
      }

      setCurrentStep('revealing');
      return {
        success: true,
        txHash: submitScore.txHash,
      };
    } catch (err) {
      flowError.current = err as Error;
      setCurrentStep('error');
      return {
        success: false,
        error: err as Error,
      };
    }
  }, [submitScore]);

  const revealGameWinner = useCallback(async (sessionId: number) => {
    try {
      setCurrentStep('revealing');
      const revealed = await revealWinner.revealWinner(sessionId);

      if (!revealed) {
        throw new Error(revealWinner.error?.message ?? 'Failed to reveal winner');
      }

      setCurrentStep('complete');
      return {
        success: true,
        txHash: revealWinner.txHash,
        winner: revealWinner.winner,
      };
    } catch (err) {
      flowError.current = err as Error;
      setCurrentStep('error');
      return {
        success: false,
        error: err as Error,
      };
    }
  }, [revealWinner]);

  return {
    // State
    currentStep,
    error: flowError.current,

    // Actions
    executeGameFlow,
    submitGameScore,
    revealGameWinner,

    // Individual hook states
    isStarting: startGame.isStarting,
    isSubmitting: submitScore.isSubmitting,
    isRevealing: revealWinner.isRevealing,

    // Transaction hashes
    startTxHash: startGame.txHash,
    submitTxHash: submitScore.txHash,
    revealTxHash: revealWinner.txHash,
  };
}
