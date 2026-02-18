/**
 * Game Cell Component
 * Individual minesweeper cell with animations
 */

'use client';

import { Flag, Bomb, Zap } from 'lucide-react';
import { Cell } from '@/lib/game/types';
import { THEME_COLORS } from '@/lib/game/types';

interface GameCellProps {
  cell: Cell;
  onClick: () => void;
  onRightClick?: () => void;
  disabled?: boolean;
  showHint?: boolean;
  actionMode?: 'reveal' | 'flag';
}

export function GameCell({
  cell,
  onClick,
  onRightClick,
  disabled = false,
  showHint = false,
  actionMode = 'reveal',
}: GameCellProps) {
  const { x, y, value, state, isSafe } = cell;

  // Determine cell colors based on state and value
  const getBackgroundColor = () => {
    if (state === 'revealed') {
      if (value === -1) return THEME_COLORS.mine; // Exploded mine
      if (value === 0) return THEME_COLORS.background;
      return THEME_COLORS.surface;
    }
    if (state === 'flagged') return THEME_COLORS.flag;
    if (state === 'exploded') return THEME_COLORS.mine;

    // Hidden cells
    if (showHint && isSafe) return 'rgba(83, 141, 78, 0.3)'; // Green tint for safe hint
    if (actionMode === 'flag') return 'rgba(181, 159, 59, 0.2)'; // Yellow tint for flag mode
    return THEME_COLORS.surface;
  };

  const getTextColor = () => {
    if (value === 1) return THEME_COLORS.num1;
    if (value === 2) return THEME_COLORS.num2;
    if (value === 3) return THEME_COLORS.num3;
    if (value === 4) return THEME_COLORS.num4;
    if (value === 5) return THEME_COLORS.num5;
    if (value === 6) return THEME_COLORS.num6;
    if (value === 7) return THEME_COLORS.num7;
    if (value === 8) return THEME_COLORS.num8;
    return THEME_COLORS.textPrimary;
  };

  const getCellContent = () => {
    if (state === 'flagged') return <Flag className="w-4 h-4" />;
    if (state === 'revealed') {
      if (value === -1) return <Bomb className="w-4 h-4" />;
      if (value === 0) return '';
      return value.toString();
    }
    if (state === 'exploded') return <Zap className="w-5 h-5" />;
    return '';
  };

  const getBorderColor = () => {
    if (state === 'hidden' || state === 'flagged') return THEME_COLORS.border;
    return 'transparent';
  };

  return (
    <button
      className={`
        relative w-full h-full flex items-center justify-center
        text-sm font-semibold transition-all duration-150
        hover:brightness-110 active:brightness-95
        ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        ${state === 'revealed' && value === 0 ? 'border-transparent' : ''}
      `}
      style={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        border: `1px solid ${getBorderColor()}`,
      }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick?.();
      }}
      disabled={disabled}
      aria-label={`Cell ${x},${y} ${state}`}
      data-x={x}
      data-y={y}
    >
      {getCellContent()}

      {/* Hover effect for action mode */}
      {state === 'hidden' && !disabled && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity pointer-events-none"
          style={{
            backgroundColor: actionMode === 'flag' ? THEME_COLORS.flag : THEME_COLORS.safe,
          }}
        />
      )}

      {/* Reveal animation */}
      {state === 'revealed' && (
        <div
          className="absolute inset-0 animate-pulse pointer-events-none"
          style={{
            backgroundColor: value === -1 ? 'rgba(218, 79, 73, 0.2)' : 'rgba(83, 141, 78, 0.1)',
          }}
        />
      )}
    </button>
  );
}

/**
 * Small cell variant for opponent board preview
 */
interface SmallCellProps {
  cell: Cell;
}

export function SmallGameCell({ cell }: SmallCellProps) {
  const { state, value } = cell;

  const getBackgroundColor = () => {
    if (state === 'revealed') {
      if (value === -1) return THEME_COLORS.mine;
      if (value === 0) return THEME_COLORS.background;
      return THEME_COLORS.surface;
    }
    if (state === 'flagged') return THEME_COLORS.flag;
    return THEME_COLORS.surface;
  };

  return (
    <div
      className="w-4 h-4 border flex items-center justify-center"
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: THEME_COLORS.border,
      }}
    >
      {state === 'flagged' && <Flag className="w-3 h-3" />}
      {state === 'revealed' && value === -1 && <Bomb className="w-3 h-3" />}
    </div>
  );
}
