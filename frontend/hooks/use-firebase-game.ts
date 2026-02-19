/**
 * Firebase Game Hooks
 * React hooks for Firebase game session management
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, push, onValue, set, update, get, off } from 'firebase/database';
import { db, DB_PATHS } from '@/lib/firebase/client';
import { SeedCommit, ZKProof, PlayerMove } from '@/lib/game/types';

// ============================================================================
// TYPES
// ============================================================================

export interface GameSession {
  id: string;
  roomId: string;
  status: 'commit' | 'reveal' | 'playing' | 'finished';
  player1Address: string;
  player2Address: string;
  player1Commit?: string;
  player2Commit?: string;
  player1Seed?: string;
  player2Seed?: string;
  player1Score?: number;
  player2Score?: number;
  player1Proof?: ZKProof;
  player2Proof?: ZKProof;
  winner?: string;
  combinedSeed?: string;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface PlayerProgress {
  score: number;
  revealed: number;
  remaining: number;
  lastMove: PlayerMove | null;
}

// ============================================================================
// HOOK: GAME SESSION SUBSCRIPTION
// ============================================================================

/**
 * Hook to subscribe to a game session's updates
 */
export function useGameSession(sessionId: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }

    const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);

    const unsubscribe = onValue(
      sessionRef,
      (snapshot) => {
        setLoading(false);
        if (!snapshot.exists()) {
          setSession(null);
          return;
        }

        const data = snapshot.val();
        setSession({
          id: sessionId,
          roomId: data.roomId,
          status: data.status,
          player1Address: data.player1Address,
          player2Address: data.player2Address,
          player1Commit: data.player1Commit,
          player2Commit: data.player2Commit,
          player1Seed: data.player1Seed,
          player2Seed: data.player2Seed,
          player1Score: data.player1Score,
          player2Score: data.player2Score,
          player1Proof: data.player1Proof,
          player2Proof: data.player2Proof,
          winner: data.winner,
          combinedSeed: data.combinedSeed,
          createdAt: data.createdAt,
          startedAt: data.startedAt,
          finishedAt: data.finishedAt,
        });
      },
      (err) => {
        setLoading(false);
        setError(err as Error);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return { session, loading, error };
}

// ============================================================================
// HOOK: OPPONENT PROGRESS
// ============================================================================

/**
 * Hook to track opponent's real-time progress
 */
export function useOpponentProgress(sessionId: string | null, opponentAddress: string | null) {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId || !opponentAddress) {
      setProgress(null);
      return;
    }

    const progressRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}/progress/${opponentAddress}`);

    const unsubscribe = onValue(
      progressRef,
      (snapshot) => {
        setLoading(false);
        if (!snapshot.exists()) {
          setProgress(null);
          return;
        }

        const data = snapshot.val();
        setProgress({
          score: data.score || 0,
          revealed: data.revealed || 0,
          remaining: data.remaining || 0,
          lastMove: data.lastMove || null,
        });
      },
      (err) => {
        setLoading(false);
        setError(err as Error);
      }
    );

    return () => unsubscribe();
  }, [sessionId, opponentAddress]);

  return { progress, loading, error };
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook for game session mutations
 */
export function useGameMutations() {
  const [isCommitting, setIsCommitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const commitError = useRef<Error | null>(null);
  const revealError = useRef<Error | null>(null);
  const scoreError = useRef<Error | null>(null);

  /**
   * Create a new game session
   */
  const createSession = useCallback(async (
    roomId: string,
    player1Address: string,
    player2Address: string
  ): Promise<string | null> => {
    try {
      const sessionsRef = ref(db, DB_PATHS.SESSIONS);
      const newSessionRef = push(sessionsRef);
      const sessionId = newSessionRef.key!;

      const newSession: Omit<GameSession, 'id'> = {
        roomId,
        player1Address,
        player2Address,
        status: 'commit',
        createdAt: Date.now(),
      };

      await set(newSessionRef, newSession);
      return sessionId;
    } catch (err) {
      console.error('Error creating session:', err);
      return null;
    }
  }, []);

  /**
   * Commit seed (submit hash of seed + salt)
   */
  const commitSeed = useCallback(async (
    sessionId: string,
    playerAddress: string,
    commitHash: string
  ): Promise<boolean> => {
    console.log('[doCommit] Starting doCommit', { sessionId, playerAddress, commitHash });
    setIsCommitting(true);
    commitError.current = null;

    try {
      const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);

      // Determine if player 1 or player 2
      console.log('[doCommit] Getting session data...');
      const sessionSnapshot = await get(sessionRef);
      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionSnapshot.val();
      console.log('[doCommit] Session data before commit:', sessionData);

      const isPlayer1 = sessionData.player1Address === playerAddress;
      const field = isPlayer1 ? 'player1Commit' : 'player2Commit';

      console.log('[doCommit] Player identification:', { isPlayer1, field, playerAddress });

      console.log('[doCommit] Updating session with commit...');
      await update(sessionRef, {
        [field]: commitHash,
      });
      console.log('[doCommit] Commit update successful');

      // Check if both players committed
      console.log('[doCommit] Checking if both players committed...');
      const updatedSnapshot = await get(sessionRef);
      const updatedData = updatedSnapshot.val();
      console.log('[doCommit] Updated session data:', updatedData);

      if (updatedData.player1Commit && updatedData.player2Commit) {
        console.log('[doCommit] Both players committed, updating status to reveal');
        await update(sessionRef, { status: 'reveal' });
      } else {
        console.log('[doCommit] Not both players committed yet', {
          player1Commit: updatedData.player1Commit,
          player2Commit: updatedData.player2Commit
        });
      }

      setIsCommitting(false);
      console.log('[doCommit] Completed successfully');
      return true;
    } catch (err) {
      console.error('[doCommit] Error:', err);
      commitError.current = err as Error;
      setIsCommitting(false);
      return false;
    }
  }, []);

  /**
   * Reveal seed (submit actual seed and salt)
   */
  const revealSeed = useCallback(async (
    sessionId: string,
    playerAddress: string,
    seed: string
  ): Promise<boolean> => {
    setIsRevealing(true);
    revealError.current = null;

    try {
      const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);

      // Determine if player 1 or player 2
      const sessionSnapshot = await get(sessionRef);
      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionSnapshot.val();
      const isPlayer1 = sessionData.player1Address === playerAddress;
      const seedField = isPlayer1 ? 'player1Seed' : 'player2Seed';

      await update(sessionRef, {
        [seedField]: seed,
      });

      // Check if both players revealed
      const updatedSnapshot = await get(sessionRef);
      const updatedData = updatedSnapshot.val();

      if (updatedData.player1Seed && updatedData.player2Seed) {
        // Combine seeds and start game
        const combinedSeed = updatedData.player1Seed + updatedData.player2Seed;
        await update(sessionRef, {
          combinedSeed,
          status: 'playing',
          startedAt: Date.now(),
        });
      }

      setIsRevealing(false);
      return true;
    } catch (err) {
      revealError.current = err as Error;
      setIsRevealing(false);
      return false;
    }
  }, []);

  /**
   * Submit score
   */
  const submitScore = useCallback(async (
    sessionId: string,
    playerAddress: string,
    score: number
  ): Promise<boolean> => {
    setIsSubmittingScore(true);
    scoreError.current = null;

    try {
      const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);

      // Determine if player 1 or player 2
      const sessionSnapshot = await get(sessionRef);
      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionSnapshot.val();
      const isPlayer1 = sessionData.player1Address === playerAddress;
      const scoreField = isPlayer1 ? 'player1Score' : 'player2Score';

      await update(sessionRef, {
        [scoreField]: score,
      });

      setIsSubmittingScore(false);
      return true;
    } catch (err) {
      scoreError.current = err as Error;
      setIsSubmittingScore(false);
      return false;
    }
  }, []);

  /**
   * Update player progress (real-time)
   */
  const updateProgress = useCallback(async (
    sessionId: string,
    playerAddress: string,
    progress: Omit<PlayerProgress, 'lastMove'>
  ): Promise<void> => {
    try {
      const progressRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}/progress/${playerAddress}`);
      await set(progressRef, progress);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  }, []);

  /**
   * Submit ZK proof
   */
  const submitProof = useCallback(async (
    sessionId: string,
    playerAddress: string,
    proof: ZKProof
  ): Promise<boolean> => {
    try {
      const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);

      // Determine if player 1 or player 2
      const sessionSnapshot = await get(sessionRef);
      if (!sessionSnapshot.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionSnapshot.val();
      const isPlayer1 = sessionData.player1Address === playerAddress;
      const proofField = isPlayer1 ? 'player1Proof' : 'player2Proof';

      await update(sessionRef, {
        [proofField]: proof,
      });

      // Check if both players submitted proofs
      const updatedSnapshot = await get(sessionRef);
      const updatedData = updatedSnapshot.val();

      if (updatedData.player1Proof && updatedData.player2Proof) {
        // Determine winner
        const player1Score = updatedData.player1Score || 0;
        const player2Score = updatedData.player2Score || 0;
        const winner = player1Score > player2Score
          ? updatedData.player1Address
          : player2Score > player1Score
            ? updatedData.player2Address
            : 'tie';

        await update(sessionRef, {
          status: 'finished',
          winner,
          finishedAt: Date.now(),
        });
      }

      return true;
    } catch (err) {
      console.error('Error submitting proof:', err);
      return false;
    }
  }, []);

  return {
    createSession,
    commitSeed,
    revealSeed,
    submitScore,
    updateProgress,
    submitProof,
    isCommitting,
    isRevealing,
    isSubmittingScore,
    commitError: commitError.current,
    revealError: revealError.current,
    scoreError: scoreError.current,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate combined seed from both player seeds
 */
export function combineSeeds(seed1: string, seed2: string): string {
  // Simple concatenation with a separator
  return `${seed1}:${seed2}`;
}

// ============================================================================
// HOOK: SEED COMMITMENT
// ============================================================================

/**
 * Hook for seed commitment management
 * Manages the local seed, commit hash, and commit/reveal operations
 */
export function useSeedCommitment(roomId: string | null, playerAddress: string | null) {
  const [localSeed, setLocalSeed] = useState<string | null>(null);
  const [localCommit, setLocalCommit] = useState<{ hash: string; seed: string; salt: string } | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [opponentCommit, setOpponentCommit] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { commitSeed: doCommit, revealSeed: doReveal } = useGameMutations();

  // Subscribe to room to get session ID
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSessionId(data.sessionId || null);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Subscribe to session to track opponent's commit
  useEffect(() => {
    if (!sessionId || !playerAddress) return;

    const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('[useSeedCommitment] Session update:', {
          sessionId,
          player1Commit: data.player1Commit,
          player2Commit: data.player2Commit,
          playerAddress,
        });

        // Determine opponent's commit
        if (data.player1Address === playerAddress) {
          // I'm player1, check player2's commit
          setOpponentCommit(data.player2Commit || null);
        } else if (data.player2Address === playerAddress) {
          // I'm player2, check player1's commit
          setOpponentCommit(data.player1Commit || null);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, playerAddress]);

  // Initialize localCommit if already committed (for players joining existing sessions)
  useEffect(() => {
    if (!sessionId || !playerAddress) return;

    const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();

      // Determine which player this is and restore their commit/seed
      if (data.player1Address === playerAddress) {
        // I am player1
        if (data.player1Commit) {
          setLocalCommit({
            hash: data.player1Commit,
            seed: data.player1Seed || '',
            salt: ''
          });
        }
        if (data.player1Seed) {
          setLocalSeed(data.player1Seed);
        }
      } else if (data.player2Address === playerAddress) {
        // I am player2
        if (data.player2Commit) {
          setLocalCommit({
            hash: data.player2Commit,
            seed: data.player2Seed || '',
            salt: ''
          });
        }
        if (data.player2Seed) {
          setLocalSeed(data.player2Seed);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, playerAddress]);

  /**
   * Generate a random seed and commit it
   */
  const commitSeed = useCallback(async (): Promise<boolean> => {
    if (!roomId || !playerAddress) {
      console.log('[commitSeed] Missing roomId or playerAddress', { roomId, playerAddress });
      return false;
    }

    console.log('[commitSeed] Starting commit flow', { roomId, playerAddress });
    setIsCommitting(true);

    try {
      // Generate cryptographically secure random seed and salt
      // Math.random() is insecure and predictable - use crypto.getRandomValues() instead
      const seed = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(b => b.toString(36))
        .join('')
        .substring(0, 12);
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(b => b.toString(36))
        .join('')
        .substring(0, 12);

      // Create commit hash (simple hash for demo - use crypto in production)
      const hash = btoa(`${seed}:${salt}`);

      console.log('[commitSeed] Generated seed and hash', { seed, hash });

      // Store locally
      setLocalSeed(seed);
      setLocalCommit({ hash, seed, salt });

      // Create session if needed and commit
      console.log('[commitSeed] Getting or creating session...');
      const session = await getOrCreateSession(roomId, playerAddress);
      console.log('[commitSeed] Session result:', { session });

      if (session) {
        console.log('[commitSeed] Calling doCommit...');
        const commitResult = await doCommit(session, playerAddress, hash);
        console.log('[commitSeed] doCommit result:', { commitResult });
      } else {
        console.error('[commitSeed] Failed to get session');
      }

      setIsCommitting(false);
      return true;
    } catch (err) {
      console.error('Error committing seed:', err);
      setIsCommitting(false);
      return false;
    }
  }, [roomId, playerAddress, doCommit]);

  /**
   * Reveal the actual seed
   */
  const revealSeed = useCallback(async (): Promise<boolean> => {
    if (!roomId || !playerAddress || !localSeed) {
      console.error('[revealSeed] Cannot reveal: missing data', { roomId, playerAddress, localSeed });
      return false;  // Don't set isRevealing since we're not starting the operation
    }

    setIsRevealing(true);

    try {
      const session = await getOrCreateSession(roomId, playerAddress);
      if (session) {
        await doReveal(session, playerAddress, localSeed);
      }

      setIsRevealing(false);
      return true;
    } catch (err) {
      console.error('Error revealing seed:', err);
      setIsRevealing(false);
      return false;
    }
  }, [roomId, playerAddress, localSeed, doReveal]);

  return {
    localSeed,
    localCommit,
    isCommitting,
    isRevealing,
    commitSeed,
    revealSeed,
    opponentCommit,
  };
}

// ============================================================================
// HOOK: COMBINED SEED
// ============================================================================

/**
 * Hook for managing the combined seed
 * Subscribes to the session and tracks when both seeds are revealed
 */
export function useCombinedSeed(roomId: string | null) {
  const [combinedSeed, setCombinedSeed] = useState<string | null>(null);
  const [canGenerate, setCanGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Subscribe to room to get session ID
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('[useCombinedSeed] Room update:', { roomId, sessionId: data.sessionId });
        setSessionId(data.sessionId || null);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Subscribe to session
  const { session } = useGameSession(sessionId);

  // Check if both seeds revealed
  useEffect(() => {
    console.log('[useCombinedSeed] Session update:', {
      sessionId,
      player1Seed: session?.player1Seed,
      player2Seed: session?.player2Seed,
      combinedSeed: session?.combinedSeed,
      canGenerate,
    });

    if (session?.player1Seed && session?.player2Seed && !session?.combinedSeed) {
      console.log('[useCombinedSeed] Both seeds revealed, canGenerate = true');
      setCanGenerate(true);
    } else {
      setCanGenerate(false);
    }

    if (session?.combinedSeed) {
      setCombinedSeed(session.combinedSeed);
      setCanGenerate(false);
    }
  }, [session, sessionId]);

  /**
   * Generate the combined seed
   */
  const generateSeed = useCallback(async (): Promise<string | null> => {
    if (!sessionId || !session?.player1Seed || !session?.player2Seed) {
      return null;
    }

    setIsGenerating(true);

    try {
      const combined = combineSeeds(session.player1Seed, session.player2Seed);

      // Update session with combined seed
      const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${sessionId}`);
      await update(sessionRef, {
        combinedSeed: combined,
        status: 'playing',
        startedAt: Date.now(),
      });

      setCombinedSeed(combined);
      setIsGenerating(false);
      return combined;
    } catch (err) {
      console.error('Error generating combined seed:', err);
      setIsGenerating(false);
      return null;
    }
  }, [sessionId, session]);

  return {
    combinedSeed,
    canGenerate,
    isGenerating,
    generateSeed,
  };
}

// ============================================================================
// HELPER: Get or Create Session
// ============================================================================

/**
 * Helper to get existing session or create new one
 * When Player 2 joins, this function updates player2Address in the session
 */
async function getOrCreateSession(roomId: string, playerAddress: string): Promise<string | null> {
  try {
    // First, try to find existing session for this room
    const roomsRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);
    const roomSnapshot = await get(roomsRef);

    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.val();
      if (roomData.sessionId) {
        // Session exists, check if we need to add player2
        const sessionRef = ref(db, `${DB_PATHS.SESSIONS}/${roomData.sessionId}`);
        const sessionSnapshot = await get(sessionRef);

        if (sessionSnapshot.exists()) {
          const sessionData = sessionSnapshot.val();
          // If player2Address is null and this is not player1, add as player2
          if (!sessionData.player2Address && sessionData.player1Address !== playerAddress) {
            await update(sessionRef, { player2Address: playerAddress });
          }
        }

        return roomData.sessionId;
      }
    }

    // Create new session
    const sessionsRef = ref(db, DB_PATHS.SESSIONS);
    const newSessionRef = push(sessionsRef);
    const newSessionId = newSessionRef.key!;

    // Initialize session
    await set(newSessionRef, {
      roomId,
      player1Address: playerAddress, // Will be updated when player2 joins
      player2Address: null,
      status: 'commit',
      createdAt: Date.now(),
    });

    // Link session to room
    await update(roomsRef, { sessionId: newSessionId });

    return newSessionId;
  } catch (err) {
    console.error('Error getting or creating session:', err);
    return null;
  }
}
