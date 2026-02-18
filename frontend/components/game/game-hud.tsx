/**
 * Game HUD Component
 * Header with score, timer, mode toggle, and controls
 */

'use client';

import { Flag, Shuffle, Lightbulb, Clock, Trophy, Zap } from 'lucide-react';
import { useGameHUD } from '@/hooks/use-minesweeper-game';
import { useMinesweeperStore } from '@/lib/game/store';
import { THEME_COLORS, GAME_CONFIG } from '@/lib/game/types';
import { cn } from '@/lib/utils';

export function GameHUD() {
  const {
    timer,
    formattedTime,
    progress,
    score,
    actionMode,
    toggleActionMode,
    showHint,
    setShowHint,
    canPlay,
    phase,
  } = useGameHUD();

  const hintsRemaining = useMinesweeperStore((s) => s.hintsRemaining);
  const useHint = useMinesweeperStore((s) => s.useHint);

  const timeLeft = Math.max(0, GAME_CONFIG.TIMEOUT_MINUTES * 60 - timer);
  const timePercent = (timeLeft / (GAME_CONFIG.TIMEOUT_MINUTES * 60)) * 100;
  const isTimeLow = timePercent < 25;

  return (
    <div className="w-full bg-surface border-b border-border p-4 space-y-4">
      {/* Top Row: Score, Timer, Progress */}
      <div className="flex items-center justify-between gap-4">
        {/* Score */}
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: THEME_COLORS.action }}
          >
            <Trophy className="w-5 h-5" style={{ color: THEME_COLORS.background }} />
          </div>
          <div>
            <div className="text-xs text-textSecondary">Score</div>
            <div className="text-xl font-bold text-textPrimary">{score}</div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          <Clock
            className="w-5 h-5"
            style={{ color: isTimeLow ? THEME_COLORS.mine : THEME_COLORS.textSecondary }}
          />
          <div className="text-center">
            <div className="text-2xl font-bold font-mono" style={{ color: isTimeLow ? THEME_COLORS.mine : THEME_COLORS.textPrimary }}>
              {formattedTime}
            </div>
            <div className="text-xs text-textSecondary">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} left
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-textSecondary">Progress</span>
            <span className="text-textPrimary">{progress}%</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: THEME_COLORS.safe,
              }}
            />
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear',
            isTimeLow && 'animate-pulse'
          )}
          style={{
            width: `${timePercent}%`,
            backgroundColor: isTimeLow ? THEME_COLORS.mine : THEME_COLORS.flag,
          }}
        />
      </div>

      {/* Bottom Row: Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Reveal Mode Button */}
        <button
          onClick={toggleActionMode}
          disabled={!canPlay}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all',
            'border-2',
            actionMode === 'reveal' ? 'border-safe bg-safe/10' : 'border-border bg-surface',
            !canPlay && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            color: actionMode === 'reveal' ? THEME_COLORS.safe : THEME_COLORS.textSecondary,
          }}
        >
          <Zap className="w-4 h-4" />
          <span>DIG</span>
        </button>

        {/* Flag Mode Button */}
        <button
          onClick={toggleActionMode}
          disabled={!canPlay}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all',
            'border-2',
            actionMode === 'flag' ? 'border-flag bg-flag/10' : 'border-border bg-surface',
            !canPlay && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            color: actionMode === 'flag' ? THEME_COLORS.flag : THEME_COLORS.textSecondary,
          }}
        >
          <Flag className="w-4 h-4" />
          <span>FLAG</span>
        </button>

        {/* Hint Button */}
        <button
          onClick={() => {
            if (showHint) {
              setShowHint(false);
            } else {
              useHint();
            }
          }}
          disabled={!canPlay || hintsRemaining <= 0}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg transition-all border-2',
            showHint ? 'border-safe bg-safe/10' : 'border-border bg-surface',
            !canPlay && 'opacity-50 cursor-not-allowed',
            hintsRemaining <= 0 && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            color: showHint ? THEME_COLORS.safe : THEME_COLORS.textSecondary,
          }}
          title={hintsRemaining > 0 ? `${hintsRemaining} hint${hintsRemaining > 1 ? 's' : ''} remaining` : 'No hints remaining'}
        >
          <Lightbulb className="w-5 h-5" />
          <span className="font-semibold">{hintsRemaining}</span>
        </button>
      </div>

      {/* Phase Indicator */}
      {phase !== 'playing' && phase !== 'lobby' && (
        <div className="text-center py-2 px-4 rounded bg-surface border border-border">
          <span className="text-sm text-textSecondary">
            Phase: <span className="font-semibold text-textPrimary">{phase.toUpperCase()}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact HUD variant for smaller screens
 */
export function CompactGameHUD() {
  const {
    formattedTime,
    score,
    actionMode,
    toggleActionMode,
    showHint,
    setShowHint,
    canPlay,
  } = useGameHUD();

  const hintsRemaining = useMinesweeperStore((s) => s.hintsRemaining);
  const useHint = useMinesweeperStore((s) => s.useHint);

  return (
    <div className="w-full bg-surface border-b border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-safe" />
          <span className="text-lg font-bold text-textPrimary">{score}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono text-textPrimary">{formattedTime}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleActionMode}
            disabled={!canPlay}
            className={cn(
              'px-3 py-2 rounded font-semibold text-sm border-2 transition-all',
              actionMode === 'reveal'
                ? 'border-safe bg-safe/10 text-safe'
                : 'border-flag bg-flag/10 text-flag'
            )}
          >
            {actionMode === 'reveal' ? (
              <>
                <Zap className="w-4 h-4 inline" /> DIG
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 inline" /> FLAG
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (showHint) {
                setShowHint(false);
              } else {
                useHint();
              }
            }}
            disabled={!canPlay || hintsRemaining <= 0}
            className={cn(
              'px-3 py-2 rounded font-semibold text-sm border-2 transition-all',
              showHint ? 'border-safe bg-safe/10' : 'border-border bg-surface',
              (!canPlay || hintsRemaining <= 0) && 'opacity-50 cursor-not-allowed'
            )}
            title={`${hintsRemaining} hint${hintsRemaining > 1 ? 's' : ''} remaining`}
          >
            <Lightbulb className="w-4 h-4 inline" /> {hintsRemaining}
          </button>
        </div>
      </div>
    </div>
  );
}
