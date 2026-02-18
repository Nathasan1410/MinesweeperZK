/**
 * Firebase Configuration
 * Updated for Minesweeper ZK project
 */

export const firebaseConfig = {
  // Using existing Firebase project (previously penaltyshootout)
  apiKey: "AIzaSyDGoMZQia334izw8JedslMTUD0fNpmFca0",
  authDomain: "penaltyshootout-9e662.firebaseapp.com",
  databaseURL: "https://penaltyshootout-9e662-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "penaltyshootout-9e662",
  storageBucket: "penaltyshootout-9e662.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID", // Update if needed
  appId: "YOUR_APP_ID", // Update if needed
  measurementId: "YOUR_MEASUREMENT_ID", // Update if needed
};

// Database paths
export const DB_PATHS = {
  ROOMS: 'rooms',
  ROOM_STATE: 'roomState',
  GAME_SESSIONS: 'gameSessions',
  PLAYER_MOVES: 'playerMoves',
  SEED_COMMITS: 'seedCommits',
} as const;

// Room TTL (milliseconds)
export const ROOM_TTL = 24 * 60 * 60 * 1000; // 24 hours
export const GAME_TIMEOUT = 15 * 60 * 1000; // 15 minutes
