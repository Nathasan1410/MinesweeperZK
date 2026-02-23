/**
 * Tests for Firebase Room Hooks
 * TDD Approach: Write failing tests first, then implement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as React from 'react';
import {
  useRoomList,
  useRoom,
  useRoomByCode,
  useRoomMutations,
  generateRoomCode,
  formatRoomStatus,
  getRoomByCode,
  joinRoom as standaloneJoinRoom,
  type FirebaseRoom,
} from '../use-firebase-room';

// Mock Firebase Realtime Database
const mockOnValue = vi.fn();
const mockPush = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockOff = vi.fn();
const mockQuery = vi.fn();
const mockOrderByChild = vi.fn();
const mockEqualTo = vi.fn();

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({
    key: 'mock-key',
    path,
  })),
  push: vi.fn((ref) => {
    mockPush(ref);
    return { key: 'new-room-id' };
  }),
  set: vi.fn((ref, data) => mockSet(ref, data)),
  update: vi.fn((ref, data) => mockUpdate(ref, data)),
  get: vi.fn((ref) => mockGet(ref)),
  onValue: vi.fn((ref, callback, errorCallback) => {
    mockOnValue(ref, callback, errorCallback);
    // Return unsubscribe function
    return () => mockOff(ref);
  }),
  off: vi.fn((ref) => mockOff(ref)),
  query: vi.fn((ref, ...constraints) => {
    mockQuery(ref, ...constraints);
    return ref;
  }),
  orderByChild: vi.fn((field) => {
    mockOrderByChild(field);
    return field;
  }),
  equalTo: vi.fn((value) => {
    mockEqualTo(value);
    return value;
  }),
  child: vi.fn(),
}));

// Mock Firebase client
vi.mock('@/lib/firebase/client', () => ({
  db: {},
  DB_PATHS: {
    ROOMS: 'rooms',
    ROOM_STATE: 'roomState',
    SESSIONS: 'sessions',
    GAME_SESSIONS: 'gameSessions',
    PLAYER_MOVES: 'playerMoves',
    SEED_COMMITS: 'seedCommits',
  },
}));

describe('useRoomList', () => {
  let mockCallback: Function;
  let mockErrorCallback: Function;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCallback = vi.fn();
    mockErrorCallback = vi.fn();

    // Setup default successful callback behavior
    mockOnValue.mockImplementation((_ref: any, callback: Function, _errorCallback: Function) => {
      mockCallback = callback;
      mockErrorCallback = _errorCallback;
      return () => mockOff(_ref);
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useRoomList());

    expect(result.current.rooms).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should load public rooms successfully', async () => {
    const mockRooms = {
      'room1': {
        code: 'ABC1',
        name: 'Room 1',
        creator: 'Player 1',
        creatorAddress: 'GADDRESS1',
        betAmount: 10,
        isPublic: true,
        status: 'waiting',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
      'room2': {
        code: 'ABC2',
        name: 'Room 2',
        creator: 'Player 2',
        creatorAddress: 'GADDRESS2',
        betAmount: 20,
        isPublic: true,
        status: 'ready',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
    };

    const { result } = renderHook(() => useRoomList());

    // Simulate Firebase callback with data
    await act(async () => {
      mockCallback({
        exists: () => true,
        val: () => mockRooms,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.rooms).toHaveLength(2);
    expect(result.current.rooms[0]).toMatchObject({
      id: 'room1',
      code: 'ABC1',
      name: 'Room 1',
      status: 'waiting',
    });
  });

  it('should filter out inactive rooms (playing, finished)', async () => {
    const mockRooms = {
      'room1': {
        code: 'ABC1',
        name: 'Waiting Room',
        creator: 'Player 1',
        creatorAddress: 'GADDRESS1',
        betAmount: 10,
        isPublic: true,
        status: 'waiting',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
      'room2': {
        code: 'ABC2',
        name: 'Playing Room',
        creator: 'Player 2',
        creatorAddress: 'GADDRESS2',
        betAmount: 20,
        isPublic: true,
        status: 'playing',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
      'room3': {
        code: 'ABC3',
        name: 'Finished Room',
        creator: 'Player 3',
        creatorAddress: 'GADDRESS3',
        betAmount: 30,
        isPublic: true,
        status: 'finished',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
    };

    const { result } = renderHook(() => useRoomList());

    await act(async () => {
      mockCallback({
        exists: () => true,
        val: () => mockRooms,
      });
    });

    expect(result.current.rooms).toHaveLength(1);
    expect(result.current.rooms[0].status).toBe('waiting');
  });

  it('should handle empty room list', async () => {
    const { result } = renderHook(() => useRoomList());

    await act(async () => {
      mockCallback({
        exists: () => false,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.rooms).toEqual([]);
  });

  it('should handle Firebase errors', async () => {
    const mockError = new Error('Firebase permission denied');

    const { result } = renderHook(() => useRoomList());

    await act(async () => {
      mockErrorCallback(mockError);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should unsubscribe on unmount', async () => {
    const { unmount } = renderHook(() => useRoomList());

    unmount();

    expect(mockOff).toHaveBeenCalled();
  });
});

describe('useRoom', () => {
  let mockCallback: Function;
  let mockErrorCallback: Function;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCallback = vi.fn();
    mockErrorCallback = vi.fn();

    mockOnValue.mockImplementation((_ref: any, callback: Function, _errorCallback: Function) => {
      mockCallback = callback;
      mockErrorCallback = _errorCallback;
      return () => mockOff(_ref);
    });
  });

  it('should return null when roomId is null', () => {
    const { result } = renderHook(() => useRoom(null));

    expect(result.current.room).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load room data successfully', async () => {
    const mockRoomData = {
      code: 'TEST1',
      name: 'Test Room',
      creator: 'Test Creator',
      creatorAddress: 'GTESTADDRESS',
      player2Address: 'GPLAYER2',
      betAmount: 15,
      isPublic: true,
      status: 'ready',
      player1Committed: true,
      player2Committed: false,
      seed: 'test-seed',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };

    const { result } = renderHook(() => useRoom('room-123'));

    await act(async () => {
      mockCallback({
        exists: () => true,
        val: () => mockRoomData,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.room).toMatchObject({
      id: 'room-123',
      code: 'TEST1',
      name: 'Test Room',
      status: 'ready',
      player2Address: 'GPLAYER2',
    });
  });

  it('should handle room not found', async () => {
    const { result } = renderHook(() => useRoom('non-existent-room'));

    await act(async () => {
      mockCallback({
        exists: () => false,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.room).toBeNull();
  });

  it('should update room when data changes', async () => {
    const initialData = {
      code: 'TEST1',
      name: 'Test Room',
      creator: 'Test Creator',
      creatorAddress: 'GTESTADDRESS',
      betAmount: 15,
      isPublic: true,
      status: 'waiting',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };

    const updatedData = {
      ...initialData,
      status: 'ready',
      player2Address: 'GPLAYER2',
    };

    const { result } = renderHook(() => useRoom('room-123'));

    // Initial load
    await act(async () => {
      mockCallback({
        exists: () => true,
        val: () => initialData,
      });
    });

    expect(result.current.room?.status).toBe('waiting');

    // Update
    await act(async () => {
      mockCallback({
        exists: () => true,
        val: () => updatedData,
      });
    });

    expect(result.current.room?.status).toBe('ready');
    expect(result.current.room?.player2Address).toBe('GPLAYER2');
  });

  it('should handle Firebase errors', async () => {
    const mockError = new Error('Room not found');

    const { result } = renderHook(() => useRoom('room-123'));

    await act(async () => {
      mockErrorCallback(mockError);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should unsubscribe when roomId changes', async () => {
    const { rerender } = renderHook(({ roomId }) => useRoom(roomId), {
      initialProps: { roomId: 'room-1' },
    });

    rerender({ roomId: 'room-2' });

    expect(mockOff).toHaveBeenCalled();
  });
});

describe('useRoomByCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useRoomByCode(null));

    expect(result.current.room).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch room by code successfully', async () => {
    const mockRooms = {
      'room-123': {
        code: 'ABCD',
        name: 'Test Room',
        creator: 'Test Creator',
        creatorAddress: 'GTESTADDRESS',
        betAmount: 15,
        isPublic: true,
        status: 'waiting',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
      'room-456': {
        code: 'EFGH',
        name: 'Another Room',
        creator: 'Another Creator',
        creatorAddress: 'GOTHERADDRESS',
        betAmount: 20,
        isPublic: true,
        status: 'ready',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
    };

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockRooms,
    });

    const { result } = renderHook(() => useRoomByCode('EFGH'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.room).toMatchObject({
      id: 'room-456',
      code: 'EFGH',
      name: 'Another Room',
    });
  });

  it('should return null when room code not found', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({}),
    });

    const { result } = renderHook(() => useRoomByCode('NOTFOUND'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.room).toBeNull();
  });

  it('should handle empty rooms database', async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
    });

    const { result } = renderHook(() => useRoomByCode('TEST'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.room).toBeNull();
  });

  it('should handle fetch errors', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRoomByCode('TEST'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should provide refetch function', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({}),
    });

    const { result } = renderHook(() => useRoomByCode('TEST'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refetch
    await act(async () => {
      await result.current.refetch('TEST2');
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});

describe('useRoomMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  describe('createRoom', () => {
    it('should create a new room successfully', async () => {
      const { result } = renderHook(() => useRoomMutations());

      const params = {
        name: 'Test Room',
        creator: 'Test Creator',
        creatorAddress: 'GTESTADDRESS',
        betAmount: 25,
        isPublic: true,
      };

      let createResult: any = null;

      await act(async () => {
        createResult = await result.current.createRoom(params);
      });

      expect(createResult).not.toBeNull();
      expect(createResult?.roomId).toBe('new-room-id');
      expect(createResult?.roomCode).toBeDefined();
      expect(createResult?.roomCode).toHaveLength(4);
      expect(mockSet).toHaveBeenCalled();
      expect(result.current.isCreating).toBe(false);
    });

    it('should set default values for optional params', async () => {
      const { result } = renderHook(() => useRoomMutations());

      const params = {
        name: 'Test Room',
        creator: 'Test Creator',
        creatorAddress: 'GTESTADDRESS',
      };

      await act(async () => {
        await result.current.createRoom(params);
      });

      const setCall = mockSet.mock.calls[0];
      const roomData = setCall[1];

      expect(roomData.betAmount).toBe(10);
      expect(roomData.isPublic).toBe(true);
      expect(roomData.status).toBe('waiting');
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Permission denied');
      mockSet.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRoomMutations());

      const params = {
        name: 'Test Room',
        creator: 'Test Creator',
        creatorAddress: 'GTESTADDRESS',
      };

      let createResult: any = null;

      await act(async () => {
        createResult = await result.current.createRoom(params);
      });

      expect(createResult).toBeNull();
      expect(result.current.isCreating).toBe(false);
    });

    it('should generate unique room codes', async () => {
      const { result } = renderHook(() => useRoomMutations());

      const params = {
        name: 'Test Room',
        creator: 'Test Creator',
        creatorAddress: 'GTESTADDRESS',
      };

      const codes = new Set<string>();

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          const resultData = await result.current.createRoom(params);
          if (resultData?.roomCode) {
            codes.add(resultData.roomCode);
          }
        });
      }

      // Note: This might fail if Math.random produces duplicates (unlikely)
      expect(codes.size).toBeGreaterThan(5);
    });
  });

  describe('joinRoom', () => {
    it('should join an existing room successfully', async () => {
      const { result } = renderHook(() => useRoomMutations());

      let joinResult: boolean = false;

      await act(async () => {
        joinResult = await result.current.joinRoom('room-123', 'GPLAYERADDRESS');
      });

      expect(joinResult).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        { path: 'rooms/room-123', key: 'mock-key' },
        {
          player2Address: 'GPLAYERADDRESS',
          status: 'ready',
        }
      );
      expect(result.current.isJoining).toBe(false);
    });

    it('should handle join errors', async () => {
      const mockError = new Error('Room not found');
      mockUpdate.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRoomMutations());

      let joinResult: boolean = true;

      await act(async () => {
        joinResult = await result.current.joinRoom('non-existent', 'GPLAYERADDRESS');
      });

      expect(joinResult).toBe(false);
      expect(result.current.isJoining).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockUpdate.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useRoomMutations());

      let joinResult: boolean = true;

      await act(async () => {
        joinResult = await result.current.joinRoom('room-123', 'GPLAYERADDRESS');
      });

      expect(joinResult).toBe(false);
      expect(result.current.isJoining).toBe(false);
    });
  });

  describe('updateRoomStatus', () => {
    it('should update room status successfully', async () => {
      const { result } = renderHook(() => useRoomMutations());

      let updateResult: boolean = false;

      await act(async () => {
        updateResult = await result.current.updateRoomStatus('room-123', 'playing');
      });

      expect(updateResult).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        { path: 'rooms/room-123', key: 'mock-key' },
        { status: 'playing' }
      );
    });

    it('should handle update errors', async () => {
      mockUpdate.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useRoomMutations());

      let updateResult: boolean = true;

      await act(async () => {
        updateResult = await result.current.updateRoomStatus('room-123', 'playing');
      });

      expect(updateResult).toBe(false);
    });

    it('should handle all valid statuses', async () => {
      const { result } = renderHook(() => useRoomMutations());

      const statuses: Array<FirebaseRoom['status']> = ['waiting', 'ready', 'playing', 'finished'];

      for (const status of statuses) {
        mockUpdate.mockResolvedValue(undefined);

        let updateResult: boolean = false;

        await act(async () => {
          updateResult = await result.current.updateRoomStatus('room-123', status);
        });

        expect(updateResult).toBe(true);
      }
    });
  });
});

describe('Helper Functions', () => {
  describe('generateRoomCode', () => {
    it('should generate a 4-character code', () => {
      const code = generateRoomCode();

      expect(code).toBeDefined();
      expect(code).toHaveLength(4);
    });

    it('should generate uppercase codes', () => {
      const code = generateRoomCode();

      expect(code).toEqual(code.toUpperCase());
    });

    it('should generate different codes on subsequent calls', () => {
      const codes = new Set();

      for (let i = 0; i < 50; i++) {
        codes.add(generateRoomCode());
      }

      // Should generate at least some variety
      expect(codes.size).toBeGreaterThan(20);
    });
  });

  describe('formatRoomStatus', () => {
    it('should format all statuses correctly', () => {
      expect(formatRoomStatus('waiting')).toBe('Waiting for Player 2');
      expect(formatRoomStatus('ready')).toBe('Ready to Start');
      expect(formatRoomStatus('playing')).toBe('Game in Progress');
      expect(formatRoomStatus('finished')).toBe('Game Finished');
    });

    it('should handle unknown status', () => {
      // Type cast to test edge case
      const result = formatRoomStatus('unknown' as any);
      expect(result).toBe('Unknown');
    });
  });
});

describe('Standalone Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRoomByCode', () => {
    it('should find room by code', async () => {
      const mockRooms = {
        'room-123': {
          code: 'ABCD',
          name: 'Test Room',
          creator: 'Test Creator',
          creatorAddress: 'GTESTADDRESS',
          betAmount: 15,
          isPublic: true,
          status: 'waiting',
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockRooms,
      });

      const room = await getRoomByCode('ABCD');

      expect(room).not.toBeNull();
      expect(room?.code).toBe('ABCD');
      expect(room?.id).toBe('room-123');
    });

    it('should return null when room not found', async () => {
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({}),
      });

      const room = await getRoomByCode('NOTFOUND');

      expect(room).toBeNull();
    });

    it('should return null on error', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      const room = await getRoomByCode('ABCD');

      expect(room).toBeNull();
    });

    it('should handle empty database', async () => {
      mockGet.mockResolvedValue({
        exists: () => false,
      });

      const room = await getRoomByCode('ABCD');

      expect(room).toBeNull();
    });
  });

  describe('standalone joinRoom', () => {
    it('should join room successfully', async () => {
      mockUpdate.mockResolvedValue(undefined);

      const result = await standaloneJoinRoom('room-123', 'GPLAYERADDRESS');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        { path: 'rooms/room-123', key: 'mock-key' },
        {
          player2Address: 'GPLAYERADDRESS',
          status: 'ready',
        }
      );
    });

    it('should return false on error', async () => {
      mockUpdate.mockRejectedValue(new Error('Join failed'));

      const result = await standaloneJoinRoom('room-123', 'GPLAYERADDRESS');

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockUpdate.mockRejectedValue(new Error('Network timeout'));

      const result = await standaloneJoinRoom('room-123', 'GPLAYERADDRESS');

      expect(result).toBe(false);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle rapid room creation calls', async () => {
    mockSet.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRoomMutations());

    const promises = [];

    for (let i = 0; i < 5; i++) {
      promises.push(
        act(async () => {
          await result.current.createRoom({
            name: `Room ${i}`,
            creator: 'Test',
            creatorAddress: `GADDRESS${i}`,
          });
        })
      );
    }

    await Promise.all(promises);

    expect(mockSet).toHaveBeenCalledTimes(5);
  });

  it('should handle room with missing optional fields', async () => {
    const mockIncompleteRoom = {
      'room-123': {
        code: 'ABCD',
        name: 'Test Room',
        creator: 'Test Creator',
        creatorAddress: 'GTESTADDRESS',
        betAmount: 15,
        isPublic: true,
        status: 'waiting',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        // Missing: player2Address, player1Committed, player2Committed, seed
      },
    };

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => mockIncompleteRoom,
    });

    const room = await getRoomByCode('ABCD');

    expect(room).not.toBeNull();
    expect(room?.player2Address).toBeUndefined();
    expect(room?.player1Committed).toBeUndefined();
  });
});
