/**
 * Firebase Room Hooks
 * React hooks for Firebase room management
 *
 * This module provides a comprehensive set of React hooks for managing game rooms
 * in Firebase Realtime Database. It handles the complete lifecycle of rooms from
 * creation to joining, with real-time synchronization and proper error handling.
 *
 * Features:
 * - Real-time room subscription and updates
 * - Room creation with unique codes
 * - Player joining and status management
 * - Room listing for discovery
 * - Seed commitment tracking
 *
 * @packageDocumentation
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
 *
 * This hook provides real-time updates to the list of available game rooms.
 * It automatically filters to show only rooms that are in 'waiting' or 'ready'
 * status, ensuring players only see joinable rooms.
 *
 * The hook uses Firebase Realtime Database's onValue listener to automatically
 * update when rooms are created, updated, or removed.
 *
 * @returns Object containing the room list and loading/error states
 *
 * @example
 * const { rooms, loading, error } = useRoomList();
 *
 * if (loading) {
 *   return <div>Loading rooms...</div>;
 * }
 *
 * if (error) {
 *   return <div>Error loading rooms: {error.message}</div>;
 * }
 *
 * return (
 *   <div>
 *     {rooms.map(room => (
 *       <RoomCard key={room.id} room={room} />
 *     ))}
 *   </div>
 * );
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
 *
 * This hook allows components to subscribe to real-time updates for a specific
 * room. It's useful for monitoring room state changes such as:
 * - Player joining (player2Address update)
 * - Status changes (waiting → ready → playing → finished)
 * - Seed commitment progress
 * - Game session updates
 *
 * The hook automatically handles subscription cleanup when the component
 * unmounts or the roomId changes.
 *
 * @param roomId - The ID of the room to subscribe to, or null to unsubscribe
 * @returns Object containing the room data and loading/error states
 *
 * @example
 * const { room, loading, error } = useRoom(roomId);
 *
 * useEffect(() => {
 *   if (room?.status === 'ready') {
 *     // Both players are ready to start
 *     startGame();
 *   }
 * }, [room?.status]);
 *
 * if (loading) {
 *   return <div>Loading room data...</div>;
 * }
 *
 * if (error) {
 *   return <div>Error: {error.message}</div>;
 * }
 *
 * return <RoomDetails room={room} />;
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
 *
 * This hook provides functions for modifying room data in Firebase Realtime
 * Database. It includes proper loading states and error handling for all
 * mutation operations.
 *
 * Supported operations:
 * - createRoom: Creates a new room with unique code
 * - joinRoom: Adds a player to an existing room
 * - updateRoomStatus: Changes room status (waiting → ready → playing → finished)
 *
 * All mutations include loading states and error tracking.
 *
 * @returns Object containing mutation functions and their states
 *
 * @example
 * const { createRoom, joinRoom, isCreating, isJoining, createError, joinError } = useRoomMutations();
 *
 * // Create a new room
 * const handleCreate = async () => {
 *   const result = await createRoom({
 *     name: "My Game",
 *     creator: "Player 1",
 *     creatorAddress: "GDRE6Y2Q4BJJX...",
 *     betAmount: 10
 *   });
 *
 *   if (result) {
 *     // Navigate to created room
 *     router.push(`/room/${result.roomId}`);
 *   }
 * };
 *
 * // Join a room by code
 * const handleJoin = async (roomId: string) => {
 *   const success = await joinRoom(roomId, "GB6FWL5QN5J5X...");
 *   if (success) {
 *     console.log('Successfully joined room');
 *   }
 * };
 */
export function useRoomMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const createError = useRef<Error | null>(null);
  const joinError = useRef<Error | null>(null);

  /**
   * Create a new room in Firebase Realtime Database
   *
   * Creates a new game room with the following:
   * - Unique 4-character room code for joining
   * - Random expiration time (24 hours from creation)
   * - Initial 'waiting' status
   * - Creator information and bet amount
   *
   * @param params - Room creation parameters
   * @returns Object with roomId and roomCode, or null on failure
   *
   * @example
   * const result = await createRoom({
   *   name: "Speed Minesweeper",
   *   creator: "ProGamer123",
   *   creatorAddress: "GDRE6Y2Q4BJJX...",
   *   betAmount: 5, // 5 XLM
   *   isPublic: true // Show in room list
   * });
   */
  const createRoom = useCallback(async (params: CreateRoomParams): Promise<{ roomId: string; roomCode: string } | null> => {
    setIsCreating(true);
    createError.current = null;

    try {
      // Generate a cryptographically secure 4-character room code
      // Math.random() is insecure and predictable - room codes could be guessed
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomBytes = new Uint8Array(4);
      crypto.getRandomValues(randomBytes);
      const roomCode = Array.from(randomBytes)
        .map(b => chars[b % chars.length])
        .join('');

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
   * Join an existing room by adding player address
   *
   * Updates an existing room to mark it as ready to start and adds the
   * second player's address. This is typically called when a player
   * enters a room code and joins the game.
   *
   * @param roomId - The ID of the room to join
   * @param playerAddress - The Stellar address of the joining player
   * @returns true if successful, false on failure
   *
   * @example
   * const success = await joinRoom("room123", "GB6FWL5QN5J5X...");
   * if (success) {
   *   console.log('Successfully joined room');
   * } else {
   *   console.error('Failed to join room');
   * }
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
/**
 * Generate a cryptographically secure room code
 * Uses crypto.getRandomValues() to prevent room code guessing attacks
 */
export function generateRoomCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => chars[b % chars.length])
    .join('');
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

