'use client';

import { useState, useEffect } from 'react';
import { Copy, ExternalLink, CheckCircle, XCircle, Bomb, Flag, X, Trophy, Clock, Target, Grid3X3 } from 'lucide-react';
import { THEME_COLORS, GAME_CONFIG } from '@/lib/game/types';
import type { Minefield, Cell } from '@/lib/game/types';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerSummary {
  address: string;
  score: number;
  minefield: Minefield;
  time: string;
  isWinner: boolean;
}

interface DualSummaryVerdictProps {
  currentPlayerAddress: string;
  player1: PlayerSummary;
  player2: PlayerSummary;
  seed: string;
  betAmount: number;
  txHash?: string;
  onFindNewMatch: () => void;
  onBackToLobby: () => void;
}

// ============================================================================
// HELPER: Calculate stats from minefield
// ============================================================================

function getMinefieldStats(minefield: Minefield) {
  let revealedCount = 0;
  let flaggedCount = 0;
  let correctFlags = 0;
  let totalSafeCells = GAME_CONFIG.TOTAL_CELLS - GAME_CONFIG.TOTAL_MINES;

  for (const row of minefield) {
    for (const cell of row) {
      if (cell.state === 'revealed' && cell.value !== -1) {
        revealedCount++;
      }
      if (cell.state === 'flagged') {
        flaggedCount++;
        if (cell.value === -1) {
          correctFlags++;
        }
      }
    }
  }

  return {
    revealedPercent: Math.round((revealedCount / totalSafeCells) * 100),
    flaggedPercent: flaggedCount > 0 ? Math.round((correctFlags / GAME_CONFIG.TOTAL_MINES) * 100) : 0,
    revealedCount,
    flaggedCount,
    correctFlags,
  };
}

// ============================================================================
// HELPER: Generate fully revealed minefield
// ============================================================================

function generateFullyRevealedMinefield(minefield: Minefield): Minefield {
  return minefield.map(row =>
    row.map(cell => ({
      ...cell,
      state: 'revealed' as const,
    }))
  );
}

// ============================================================================
// SUB-COMPONENT: Mini Minefield
// ============================================================================

function MiniMinefield({ minefield, size = 'normal' }: { minefield: Minefield; size?: 'normal' | 'large' }) {
  const cellSize = size === 'large' ? 'w-8 h-8' : 'w-6 h-6';
  const iconSize = size === 'large' ? 14 : 10;

  return (
    <div
      className="grid gap-0"
      style={{ gridTemplateColumns: `repeat(${GAME_CONFIG.GRID_SIZE}, 1fr)` }}
    >
      {minefield.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const isMine = cell.value === -1;
          const isFlag = cell.state === 'flagged';
          const isRevealed = cell.state === 'revealed';
          const isExploded = cell.state === 'exploded';

          let bgColor: string = THEME_COLORS.border; // hidden
          if (isExploded) bgColor = '#FF3333';
          else if (isMine && isRevealed) bgColor = THEME_COLORS.mine;
          else if (isFlag && isMine) bgColor = THEME_COLORS.safe;
          else if (isFlag && !isMine) bgColor = THEME_COLORS.flag;
          else if (isRevealed && cell.value === 0) bgColor = '#1A1A1B';
          else if (isRevealed) bgColor = '#2A2A2C';

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`${cellSize} flex items-center justify-center border`}
              style={{
                borderColor: '#2A2A2C',
                backgroundColor: bgColor,
                fontSize: size === 'large' ? '11px' : '9px',
                color: THEME_COLORS.textPrimary,
                fontWeight: 600,
              }}
            >
              {isMine && isRevealed && !isFlag && <Bomb style={{ width: iconSize, height: iconSize }} />}
              {isExploded && <Bomb style={{ width: iconSize, height: iconSize, color: '#fff' }} />}
              {isFlag && isMine && <Flag style={{ width: iconSize, height: iconSize, color: '#fff' }} />}
              {isFlag && !isMine && <X style={{ width: iconSize, height: iconSize, color: '#fff' }} />}
              {!isMine && isRevealed && cell.value > 0 && cell.value}
            </div>
          );
        })
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Player Card
// ============================================================================

function PlayerCard({ player, label, isCurrentPlayer }: { player: PlayerSummary; label: string; isCurrentPlayer: boolean }) {
  const stats = getMinefieldStats(player.minefield);
  const truncatedAddress = player.address.slice(0, 6) + '...' + player.address.slice(-4);

  return (
    <div
      className="p-4 rounded-xl space-y-4 flex-1"
      style={{
        backgroundColor: THEME_COLORS.surface,
        border: `2px solid ${player.isWinner ? THEME_COLORS.safe : THEME_COLORS.border}`,
      }}
    >
      {/* Result Badge */}
      <div className="text-center">
        <span
          className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            backgroundColor: player.isWinner ? `${THEME_COLORS.safe}33` : `${THEME_COLORS.mine}33`,
            color: player.isWinner ? THEME_COLORS.safe : THEME_COLORS.mine,
          }}
        >
          {player.isWinner ? 'WINNER' : 'LOSER'}
        </span>
      </div>

      {/* Player Info */}
      <div className="text-center">
        <p className="text-xs text-textSecondary">{label}</p>
        <p className="font-mono text-sm text-textPrimary">{truncatedAddress}</p>
        {isCurrentPlayer && (
          <span className="text-xs" style={{ color: THEME_COLORS.flag }}>(You)</span>
        )}
      </div>

      {/* Minefield */}
      <div className="flex justify-center">
        <MiniMinefield minefield={player.minefield} size="normal" />
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {/* Score */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-textSecondary flex items-center gap-1">
            <Trophy className="w-3 h-3" /> Score
          </span>
          <span className="font-bold text-textPrimary">{player.score}</span>
        </div>

        {/* Field/Flag Percentages */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-textSecondary flex items-center gap-1">
            <Target className="w-3 h-3" /> Revealed
          </span>
          <span className="font-semibold text-textPrimary">{stats.revealedPercent}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-textSecondary flex items-center gap-1">
            <Flag className="w-3 h-3" /> Flags
          </span>
          <span className="font-semibold text-textPrimary">{stats.flaggedPercent}%</span>
        </div>

        {/* Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-textSecondary flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time
          </span>
          <span className="font-mono font-semibold text-textPrimary">{player.time}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: DualSummaryVerdict
// ============================================================================

export function DualSummaryVerdict({
  currentPlayerAddress,
  player1,
  player2,
  seed,
  betAmount,
  txHash,
  onFindNewMatch,
  onBackToLobby,
}: DualSummaryVerdictProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const isCurrentPlayerWinner =
    (player1.isWinner && player1.address === currentPlayerAddress) ||
    (player2.isWinner && player2.address === currentPlayerAddress);

  // Generate fully revealed minefield (from player1's minefield as base, showing all mines)
  const fullyRevealed = generateFullyRevealedMinefield(player1.minefield);

  const explorerBaseUrl = 'https://stellar.expert/explorer/testnet/tx';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">

        {/* Result Header */}
        <div
          className={`text-center transform transition-all duration-500 ${
            animate ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          }`}
        >
          {isCurrentPlayerWinner ? (
            <>
              <CheckCircle size={56} className="mx-auto mb-3" style={{ color: THEME_COLORS.safe }} />
              <h1
                className="text-4xl font-black uppercase tracking-tight"
                style={{ color: THEME_COLORS.safe, letterSpacing: '0.08em' }}
              >
                VICTORY SECURED
              </h1>
              <p className="text-lg font-semibold mt-1" style={{ color: THEME_COLORS.safe }}>
                +{betAmount * 2} XLM SENT TO WALLET
              </p>
            </>
          ) : (
            <>
              <XCircle size={56} className="mx-auto mb-3" style={{ color: THEME_COLORS.mine }} />
              <h1
                className="text-4xl font-black uppercase tracking-tight"
                style={{ color: THEME_COLORS.mine, letterSpacing: '0.08em' }}
              >
                DEFEAT
              </h1>
              <p className="text-lg font-semibold mt-1" style={{ color: THEME_COLORS.mine }}>
                -{betAmount} XLM
              </p>
            </>
          )}
        </div>

        {/* Main Grid: Player1 | Center Minefield | Player2 */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 transform transition-all duration-700 delay-100 ${
            animate ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          }`}
        >
          {/* Player 1 Card */}
          <PlayerCard
            player={player1}
            label="Player 1"
            isCurrentPlayer={player1.address === currentPlayerAddress}
          />

          {/* Center: Fully Revealed Minefield + Seed */}
          <div
            className="p-4 rounded-xl space-y-4 flex flex-col items-center"
            style={{
              backgroundColor: THEME_COLORS.surface,
              border: `1px solid ${THEME_COLORS.border}`,
            }}
          >
            {/* Fully Revealed Minefield */}
            <div>
              <h3
                className="text-xs font-black uppercase tracking-widest text-center mb-3"
                style={{ color: THEME_COLORS.textSecondary }}
              >
                REVEALED MINEFIELD
              </h3>
              <MiniMinefield minefield={fullyRevealed} size="large" />
            </div>

            {/* Seed */}
            <div className="w-full space-y-2">
              <p className="text-xs text-textSecondary uppercase tracking-wider text-center">Seed</p>
              <div
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.background, border: `1px solid ${THEME_COLORS.border}` }}
              >
                <code className="text-xs text-textPrimary font-mono flex-1 break-all">
                  {seed}
                </code>
                <button
                  onClick={() => handleCopy(seed, 'seed')}
                  className="p-1 rounded hover:bg-surface transition-colors flex-shrink-0"
                  title="Copy seed"
                >
                  <Copy size={14} style={{ color: THEME_COLORS.textSecondary }} />
                </button>
              </div>
            </div>

            {/* Contract Link */}
            {txHash && (
              <div className="w-full">
                <a
                  href={`${explorerBaseUrl}/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: THEME_COLORS.safe, border: `1px solid ${THEME_COLORS.safe}33` }}
                >
                  <ExternalLink size={12} />
                  View on Stellar Explorer
                </a>
              </div>
            )}
          </div>

          {/* Player 2 Card */}
          <PlayerCard
            player={player2}
            label="Player 2"
            isCurrentPlayer={player2.address === currentPlayerAddress}
          />
        </div>

        {/* Footer Actions */}
        <div
          className={`flex gap-4 justify-center transform transition-all duration-700 delay-300 ${
            animate ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          }`}
        >
          <button
            onClick={onFindNewMatch}
            className="px-8 py-3 border-2 font-bold uppercase text-sm transition-all hover:scale-105"
            style={{
              backgroundColor: THEME_COLORS.textPrimary,
              color: THEME_COLORS.background,
              borderColor: THEME_COLORS.textPrimary,
              letterSpacing: '0.06em',
            }}
          >
            FIND NEW MATCH
          </button>

          <button
            onClick={onBackToLobby}
            className="px-8 py-3 border-2 font-bold uppercase text-sm transition-all hover:scale-105"
            style={{
              backgroundColor: 'transparent',
              color: THEME_COLORS.textPrimary,
              borderColor: THEME_COLORS.textSecondary,
              letterSpacing: '0.06em',
            }}
          >
            BACK TO LOBBY
          </button>
        </div>

        {/* Copy Feedback */}
        {copied && (
          <div
            className="fixed bottom-8 right-8 px-4 py-2 border text-sm font-semibold rounded-lg"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.safe,
              color: THEME_COLORS.safe,
            }}
          >
            COPIED
          </div>
        )}
      </div>
    </div>
  );
}
