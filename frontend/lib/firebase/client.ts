/**
 * Firebase Client Initialization
 * Initializes Firebase app and database for the frontend
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase app (client-side only to avoid SSR issues)
let app: FirebaseApp | null = null;
let dbInstance: Database | null = null;

export function initializeFirebase(): { app: FirebaseApp; db: Database } | null {
  // Only initialize on client side with valid config
  if (typeof window === 'undefined') {
    return null; // Server-side: don't initialize
  }

  if (app && dbInstance) {
    return { app, db: dbInstance }; // Already initialized
  }

  // Check for valid config
  if (!firebaseConfig.databaseURL || !firebaseConfig.apiKey) {
    console.warn('Firebase configuration missing - skipping initialization');
    return null;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    dbInstance = getDatabase(app);
    return { app, db: dbInstance };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
}

// Lazy getter for database (initializes on first access)
export function getDb(): Database | null {
  if (dbInstance) return dbInstance;
  const result = initializeFirebase();
  return result?.db || null;
}

// Export db as a getter for compatibility
export const db = new Proxy({} as Database, {
  get(target, prop) {
    const dbInstance = getDb();
    if (dbInstance && prop in dbInstance) {
      return (dbInstance as any)[prop];
    }
    return undefined;
  },
});

// Database paths (shared constants)
export const DB_PATHS = {
  ROOMS: 'rooms',
  ROOM_STATE: 'roomState',
  SESSIONS: 'sessions',
  GAME_SESSIONS: 'gameSessions',
  PLAYER_MOVES: 'playerMoves',
  SEED_COMMITS: 'seedCommits',
} as const;

// Room TTL (milliseconds)
export const ROOM_TTL = 24 * 60 * 60 * 1000; // 24 hours
export const GAME_TIMEOUT = (parseInt(process.env.NEXT_PUBLIC_GAME_TIMEOUT_MINUTES || '15', 10)) * 60 * 1000; // From env

/**
 * Check if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return !!app && !!dbInstance;
}
