/**
 * Firebase Client Initialization
 * Initializes Firebase app and database for the frontend
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Import the shared config from backend
// Note: This works because we're in a monorepo structure
const firebaseConfig = {
  apiKey: "AIzaSyDGoMZQia334izw8JedslMTUD0fNpmFca0",
  authDomain: "penaltyshootout-9e662.firebaseapp.com",
  databaseURL: "https://penaltyshootout-9e662-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "penaltyshootout-9e662",
  storageBucket: "penaltyshootout-9e662.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const db: Database = getDatabase(app);

// Database paths (shared constants)
export const DB_PATHS = {
  ROOMS: 'rooms',
  ROOM_STATE: 'roomState',
  SESSIONS: 'sessions', // Game sessions for multiplayer
  GAME_SESSIONS: 'gameSessions',
  PLAYER_MOVES: 'playerMoves',
  SEED_COMMITS: 'seedCommits',
} as const;

// Room TTL (milliseconds)
export const ROOM_TTL = 24 * 60 * 60 * 1000; // 24 hours
export const GAME_TIMEOUT = 15 * 60 * 1000; // 15 minutes
