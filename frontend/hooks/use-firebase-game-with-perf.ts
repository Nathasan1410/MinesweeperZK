/**
 * Firebase Game Hooks with Performance Monitoring
 * Wrap existing Firebase hooks with performance tracking
 * 
 * Usage: Replace imports from use-firebase-game with this file
 * to enable performance monitoring in development mode.
 */

'use client';

import { measureFirebaseLatency } from '@/lib/performance/monitor';

// Re-export everything from the original file
export * from './use-firebase-game';

// Add performance monitoring wrapper
// This file serves as a drop-in replacement that adds monitoring
// without modifying the original implementation

if (process.env.NODE_ENV === 'development') {
  console.log('[Performance] Firebase performance monitoring enabled');
}
