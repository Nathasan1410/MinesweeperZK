/**
 * Firebase Room Hooks
 * React hooks for Firebase room management
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, push, onValue, set, update, get, child, query, orderByChild, equalTo } from 'firebase/database';
import { db, DB_PATHS } from '@/lib/firebase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface FirebaseRoom {
  id: string;
  code: string;
  name: string;
  creator: string;
  creatorAddress: string;
  player2Address?: string;
  betAmount: number;
  isPublic: boolean;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  player1Committed?: boolean;
  player2Committed?: boolean;
  seed?: string;
  createdAt: number;
  expiresAt: number;
}

export interface CreateRoomParams {
  name: string;
  creator: string;
  creatorAddress: string;
  betAmount?: number;
  isPublic?: boolean;
}

// ============================================================================
// HOOK: ROOM LIST
// ============================================================================

/**
 * Hook to fetch and subscribe to public rooms
 */
export function useRoomList() {
  const [rooms, setRooms] = useState<FirebaseRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const roomsRef = ref(db, DB_PATHS.ROOMS);
    const publicRoomsQuery = query(roomsRef, orderByChild('isPublic'), equalTo(true));

    const unsubscribe = onValue(
      publicRoomsQuery,
      (snapshot) => {
        setLoading(false);
        if (!snapshot.exists()) {
          setRooms([]);
          return;
        }

        const data = snapshot.val();
        const roomList: FirebaseRoom[] = [];

        for (const [id, room] of Object.entries(data)) {
          const r = room as any;
          // Filter to only show active rooms
          if (r.status === 'waiting' || r.status === 'ready') {
            roomList.push({
              id,
              code: r.code,
              name: r.name,
              creator: r.creator,
              creatorAddress: r.creatorAddress,
              player2Address: r.player2Address,
              betAmount: r.betAmount,
              isPublic: r.isPublic,
              status: r.status,
              player1Committed: r.player1Committed,
              player2Committed: r.player2Committed,
              seed: r.seed,
              createdAt: r.createdAt,
              expiresAt: r.expiresAt,
            });
          }
        }

        setRooms(roomList);
      },
      (err) => {
        setLoading(false);
        setError(err as Error);
      }
    );

    return () => unsubscribe();
  }, []);

  return { rooms, loading, error };
}

// ============================================================================
// HOOK: ROOM SUBSCRIPTION
// ============================================================================

/**
 * Hook to subscribe to a specific room's updates
 */
export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<FirebaseRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setLoading(false);
      return;
    }

    console.log('[useRoom] Starting subscription for room:', roomId);
    const roomRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);

    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        setLoading(false);
        if (!snapshot.exists()) {
          console.log('[useRoom] Room does not exist:', roomId);
          setRoom(null);
          return;
        }

        const data = snapshot.val();
        console.log('[useRoom] Room update received:', {
          roomId,
          status: data.status,
          player2Address: data.player2Address,
          player1Committed: data.player1Committed,
          player2Committed: data.player2Committed,
        });

        setRoom({
          id: roomId,
          code: data.code,
          name: data.name,
          creator: data.creator,
          creatorAddress: data.creatorAddress,
          player2Address: data.player2Address,
          betAmount: data.betAmount,
          isPublic: data.isPublic,
          status: data.status,
          player1Committed: data.player1Committed,
          player2Committed: data.player2Committed,
          seed: data.seed,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
        });
      },
      (err) => {
        console.error('[useRoom] Subscription error:', err);
        setLoading(false);
        setError(err as Error);
      }
    );

    return () => {
      console.log('[useRoom] Cleaning up subscription for room:', roomId);
      unsubscribe();
    };
  }, [roomId]);

  return { room, loading, error };
}

// ============================================================================
// HOOK: ROOM BY CODE
// ============================================================================

/**
 * Hook to get a room by its code
 */
export function useRoomByCode(roomCode: string | null) {
  const [room, setRoom] = useState<FirebaseRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoomByCode = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const roomsRef = ref(db, DB_PATHS.ROOMS);
      const snapshot = await get(roomsRef);

      if (!snapshot.exists()) {
        setRoom(null);
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      for (const [id, r] of Object.entries(data)) {
        const roomData = r as any;
        if (roomData.code === code) {
          setRoom({
            id,
            code: roomData.code,
            name: roomData.name,
            creator: roomData.creator,
            creatorAddress: roomData.creatorAddress,
            player2Address: roomData.player2Address,
            betAmount: roomData.betAmount,
            isPublic: roomData.isPublic,
            status: roomData.status,
            player1Committed: roomData.player1Committed,
            player2Committed: roomData.player2Committed,
            seed: roomData.seed,
            createdAt: roomData.createdAt,
            expiresAt: roomData.expiresAt,
          });
          setLoading(false);
          return;
        }
      }

      setRoom(null);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roomCode) {
      fetchRoomByCode(roomCode);
    }
  }, [roomCode, fetchRoomByCode]);

  return { room, loading, error, refetch: fetchRoomByCode };
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook for room mutations (create, join, update)
 */
export function useRoomMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const createError = useRef<Error | null>(null);
  const joinError = useRef<Error | null>(null);

  /**
   * Create a new room
   */
  const createRoom = useCallback(async (params: CreateRoomParams): Promise<{ roomId: string; roomCode: string } | null> => {
    setIsCreating(true);
    createError.current = null;

    try {
      // Generate a random 4-character room code
      const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

      const roomsRef = ref(db, DB_PATHS.ROOMS);
      const newRoomRef = push(roomsRef);
      const roomId = newRoomRef.key!;

      const newRoom: Omit<FirebaseRoom, 'id'> = {
        code: roomCode,
        name: params.name,
        creator: params.creator,
        creatorAddress: params.creatorAddress,
        betAmount: params.betAmount ?? 10,
        isPublic: params.isPublic ?? true,
        status: 'waiting',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      await set(newRoomRef, newRoom);

      setIsCreating(false);
      return { roomId, roomCode };
    } catch (err) {
      createError.current = err as Error;
      setIsCreating(false);
      return null;
    }
  }, []);

  /**
   * Join an existing room
   */
  const joinRoom = useCallback(async (roomId: string, playerAddress: string): Promise<boolean> => {
    setIsJoining(true);
    joinError.current = null;

    try {
      console.log('[joinRoom] Joining room:', { roomId, playerAddress });
      const roomRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);
      await update(roomRef, {
        player2Address: playerAddress,
        status: 'ready',
      });
      console.log('[joinRoom] Successfully joined room:', { roomId, playerAddress });

      setIsJoining(false);
      return true;
    } catch (err) {
      console.error('[joinRoom] Failed to join room:', err);
      joinError.current = err as Error;
      setIsJoining(false);
      return false;
    }
  }, []);

  /**
   * Update room status
   */
  const updateRoomStatus = useCallback(async (
    roomId: string,
    status: FirebaseRoom['status']
  ): Promise<boolean> => {
    try {
      const roomRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);
      await update(roomRef, { status });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    createRoom,
    joinRoom,
    updateRoomStatus,
    isCreating,
    isJoining,
    createError: createError.current,
    joinError: joinError.current,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a random room code
 */
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Format room status for display
 */
export function formatRoomStatus(status: FirebaseRoom['status']): string {
  switch (status) {
    case 'waiting':
      return 'Waiting for Player 2';
    case 'ready':
      return 'Ready to Start';
    case 'playing':
      return 'Game in Progress';
    case 'finished':
      return 'Game Finished';
    default:
      return 'Unknown';
  }
}

/**
 * Get room by code (for joining)
 * Searches through all rooms to find one matching the given code
 */
export async function getRoomByCode(roomCode: string): Promise<FirebaseRoom | null> {
  try {
    const roomsRef = ref(db, DB_PATHS.ROOMS);
    const snapshot = await get(roomsRef);

    if (!snapshot.exists()) {
      return null;
    }

    const rooms = snapshot.val();

    // Find room with matching code
    for (const roomId in rooms) {
      if (rooms[roomId].code === roomCode) {
        return { id: roomId, ...rooms[roomId] };
      }
    }

    return null;
  } catch (err) {
    console.error('Error finding room by code:', err);
    return null;
  }
}

/**
 * Standalone joinRoom function for direct import
 * Joins an existing room by updating it with player2's address
 */
export async function joinRoom(roomId: string, playerAddress: string): Promise<boolean> {
  try {
    const roomRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);
    await update(roomRef, {
      player2Address: playerAddress,
      status: 'ready',
    });
    return true;
  } catch (err) {
    console.error('Error joining room:', err);
    return false;
  }
}

