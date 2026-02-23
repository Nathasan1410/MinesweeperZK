/**
 * Loading Skeleton Components
 * Provides consistent loading states across the application
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { THEME_COLORS } from '@/lib/game/types';

// ============================================================================
// ROOM LIST SKELETON
// ============================================================================

export function RoomListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border"
          style={{ borderColor: THEME_COLORS.border }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// WAITING ROOM SKELETON
// ============================================================================

export function WaitingRoomSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <Skeleton className="w-16 h-16 rounded-full" />

      <div className="space-y-2 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      <div className="flex items-center justify-center gap-3">
        <Skeleton className="h-12 w-32 rounded-xl" />
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// ============================================================================
// SEED COMMITMENT SKELETON
// ============================================================================

export function SeedCommitmentSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-8 h-0.5" />
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-8 h-0.5" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      <div className="w-16 h-16 rounded-full" />

      <div className="space-y-2 text-center max-w-md">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>

      <Skeleton className="h-12 w-48 rounded-lg" />
    </div>
  );
}

// ============================================================================
// WALLET CONNECT SKELETON
// ============================================================================

export function WalletConnectSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <Skeleton className="h-10 w-32" />

      <div className="space-y-2 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      <div className="w-full space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="pt-2">
          <Skeleton className="h-4 w-32 mx-auto mb-3" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg mt-3" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GAME BOARD SKELETON
// ============================================================================

export function GameBoardSkeleton({ gridSize = 10 }: { gridSize?: number }) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-8 rounded" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// GENERIC CARD SKELETON
// ============================================================================>

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="p-6 rounded-xl space-y-4"
      style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
    >
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>

      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}

      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

// ============================================================================
// INLINE LOADING SPINNER
// ============================================================================

export function InlineLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <div
        className="w-4 h-4 border-2 rounded-full animate-spin"
        style={{
          borderColor: THEME_COLORS.safe,
          borderTopColor: 'transparent',
        }}
      />
      <span className="text-sm text-textSecondary">{text}</span>
    </div>
  );
}

// ============================================================================
// FULL PAGE LOADING
// ============================================================================

export function FullPageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div
          className="w-12 h-12 border-4 rounded-full animate-spin mx-auto"
          style={{
            borderColor: `${THEME_COLORS.safe}/30`,
            borderTopColor: THEME_COLORS.safe,
          }}
        />
        <p className="text-textSecondary">{text}</p>
      </div>
    </div>
  );
}
