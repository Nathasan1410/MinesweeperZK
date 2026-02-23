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

// Export db as a Proxy that forwards ALL properties to the actual Database instance.
// This ensures that the db reference is always up-to-date even if Firebase initializes late.
// Hooks should still use getDb() or check for null if they need guaranteed initialization.
export const db: Database = new Proxy({} as Database, {
  get(_, prop) {
    const instance = getDb();
    if (!instance) {
      // Return undefined for property access if not initialized.
      // This allows the Firebase SDK to check for internal properties without crashing,
      // though functions calling ref(db, ...) will still fail if db is not checked.
      return undefined;
    }
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
  set(_, prop, value) {
    const instance = getDb();
    if (instance) {
      (instance as any)[prop] = value;
      return true;
    }
    return false;
  },
  has(_, prop) {
    const instance = getDb();
    return instance ? prop in instance : false;
  },
  ownKeys() {
    const instance = getDb();
    return instance ? Object.getOwnPropertyNames(instance) : [];
  },
  getOwnPropertyDescriptor(_, prop) {
    const instance = getDb();
    if (!instance) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(instance, prop);
    if (descriptor) descriptor.enumerable = true;
    return descriptor;
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
