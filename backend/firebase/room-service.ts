/**
 * Firebase Room Service
 * Handles real-time room management and game state synchronization
 */

import { FirebaseRoom, FirebaseGameState, SeedCommit, PlayerMove } from '../types';

/**
 * Room Management Service
 */
export class RoomService {
  private db: any; // FirebaseDatabase instance
  private roomsPath: string;
  private sessionsPath: string;

  constructor(db: any, config: { roomsPath: string; sessionsPath: string }) {
    this.db = db;
    this.roomsPath = config.roomsPath;
    this.sessionsPath = config.sessionsPath;
  }

  // ========================================
  // ROOM MANAGEMENT
  // ========================================

  /**
   * Create a new game room
   */
  async createRoom(params: {
    code: string;
    name: string;
    creator: string;
    creatorAddress: string;
    betAmount: number;
    isPublic: boolean;
  }): Promise<string> {
    const roomRef = this.db.ref(this.roomsPath).push();
    const roomId = roomRef.key!;

    const room: FirebaseRoom = {
      id: roomId,
      code: params.code,
      name: params.name,
      creator: params.creator,
      creatorAddress: params.creatorAddress,
      betAmount: params.betAmount,
      isPublic: params.isPublic,
      status: 'waiting',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    await roomRef.set(room);
    return roomId;
  }

  /**
   * Get room by code
   */
  async getRoomByCode(code: string): Promise<FirebaseRoom | null> {
    const snapshot = await this.db
      .ref(this.roomsPath)
      .orderByChild('code')
      .equalTo(code)
      .once('value');

    if (!snapshot.exists()) return null;

    const rooms = snapshot.val();
    const roomId = Object.keys(rooms)[0];
    return rooms[roomId];
  }

  /**
   * Join a room as player 2
   */
  async joinRoom(roomId: string, playerAddress: string): Promise<void> {
    await this.db
      .ref(`${this.roomsPath}/${roomId}`)
      .update({
        player2Address: playerAddress,
        status: 'ready',
      });
  }

  /**
   * Subscribe to room updates
   */
  subscribeToRoom(roomId: string, callback: (room: FirebaseRoom | null) => void): () => void {
    const ref = this.db.ref(`${this.roomsPath}/${roomId}`);
    ref.on('value', (snapshot: any) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });

    // Return unsubscribe function
    return () => ref.off();
  }

  /**
   * Get all public rooms (for lobby)
   */
  async getPublicRooms(): Promise<FirebaseRoom[]> {
    const snapshot = await this.db
      .ref(this.roomsPath)
      .orderByChild('isPublic')
      .equalTo(true)
      .once('value');

    if (!snapshot.exists()) return [];

    const rooms = snapshot.val();
    return Object.values(rooms).filter(
      (room: any) => room.status === 'waiting' || room.status === 'ready'
    ) as FirebaseRoom[];
  }

  // ========================================
  // SEED COMMITMENT
  // ========================================

  /**
   * Commit random string for seed generation
   */
  async commitSeed(
    roomId: string,
    playerAddress: string,
    randomString: string
  ): Promise<void> {
    const commit: SeedCommit = {
      player: playerAddress,
      randomString,
      hash: await this.hashString(randomString),
      committed: true,
    };

    const isPlayer1 = randomString.includes('_p1');
    const field = isPlayer1 ? 'player1Committed' : 'player2Committed';

    await this.db
      .ref(`${this.roomsPath}/${roomId}`)
      .update({ [field]: true });
  }

  /**
   * Check if both players have committed
   */
  async areBothCommitted(roomId: string): Promise<boolean> {
    const snapshot = await this.db.ref(`${this.roomsPath}/${roomId}`).once('value');
    const room: FirebaseRoom = snapshot.val();
    return room.player1Committed && room.player2Committed;
  }

  /**
   * Generate seed from both committed strings
   */
  async generateSeed(roomId: string): Promise<string> {
    const snapshot = await this.db.ref(`${this.roomsPath}/${roomId}`).once('value');
    const room: FirebaseRoom = snapshot.val();

    // In real implementation, retrieve the committed strings and combine
    // For now, return a mock seed
    const combined = `${room.player1Address}_${room.player2Address}_${Date.now()}`;
    return this.hashString(combined);
  }

  // ========================================
  // GAME SESSION STATE
  // ========================================

  /**
   * Create game session
   */
  async createSession(roomId: string, seed: string): Promise<string> {
    const sessionRef = this.db.ref(this.sessionsPath).push();
    const sessionId = sessionRef.key!;

    const session: FirebaseGameState = {
      sessionId,
      roomId,
      phase: 'playing',
      currentPlayer: '',
      player1Score: 0,
      player2Score: 0,
      player1Finished: false,
      player2Finished: false,
      lastUpdate: Date.now(),
    };

    await sessionRef.set(session);

    // Update room with seed and status
    await this.db.ref(`${this.roomsPath}/${roomId}`).update({
      seed,
      status: 'playing',
    });

    return sessionId;
  }

  /**
   * Subscribe to game session
   */
  subscribeToSession(
    sessionId: string,
    callback: (session: FirebaseGameState | null) => void
  ): () => void {
    const ref = this.db.ref(`${this.sessionsPath}/${sessionId}`);
    ref.on('value', (snapshot: any) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return () => ref.off();
  }

  /**
   * Update player score
   */
  async updateScore(
    sessionId: string,
    playerAddress: string,
    score: number
  ): Promise<void> {
    const snapshot = await this.db.ref(`${this.sessionsPath}/${sessionId}`).once('value');
    const session: FirebaseGameState = snapshot.val();

    const isPlayer1 = playerAddress === session.player1Address;
    const field = isPlayer1 ? 'player1Score' : 'player2Score';

    await this.db
      .ref(`${this.sessionsPath}/${sessionId}`)
      .update({ [field]: score, lastUpdate: Date.now() });
  }

  /**
   * Mark player as finished
   */
  async playerFinished(sessionId: string, playerAddress: string): Promise<void> {
    const snapshot = await this.db.ref(`${this.sessionsPath}/${sessionId}`).once('value');
    const session: FirebaseGameState = snapshot.val();

    const isPlayer1 = playerAddress === session.player1Address;
    const field = isPlayer1 ? 'player1Finished' : 'player2Finished';

    await this.db
      .ref(`${this.sessionsPath}/${sessionId}`)
      .update({ [field]: true, lastUpdate: Date.now() });
  }

  /**
   * Set game winner
   */
  async setWinner(sessionId: string, winner: string): Promise<void> {
    await this.db
      .ref(`${this.sessionsPath}/${sessionId}`)
      .update({ winner, lastUpdate: Date.now() });
  }

  // ========================================
  // HELPERS
  // ========================================

  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Clean up expired rooms
   */
  async cleanupExpiredRooms(): Promise<void> {
    const now = Date.now();
    const snapshot = await this.db.ref(this.roomsPath).once('value');

    if (!snapshot.exists()) return;

    const rooms = snapshot.val();
    const updates: Record<string, null> = {};

    for (const [roomId, room] of Object.entries(rooms)) {
      const r = room as FirebaseRoom;
      if (r.expiresAt < now) {
        updates[`${this.roomsPath}/${roomId}`] = null;
      }
    }

    if (Object.keys(updates).length > 0) {
      await this.db.ref().update(updates);
    }
  }
}
