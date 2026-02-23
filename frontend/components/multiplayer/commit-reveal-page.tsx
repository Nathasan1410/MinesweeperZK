'use client';

import { useState, useEffect } from 'react';
import { Check, X, Loader2, Shield } from 'lucide-react';
import { THEME_COLORS } from '@/lib/game/types';
import type { Minefield } from '@/lib/game/types';
import { useCommitRevealStatus, useGameMutations } from '@/hooks/use-firebase-game';

// ============================================================================
// TYPES
// ============================================================================

interface CommitRevealPageProps {
  sessionId: string;
  roomId: string;
  playerAddress: string;
  opponentAddress: string;
  isCreator: boolean;
  myScore: number;
  myMinefield: Minefield;
  myTime: string;
  onBothCommitted: (sessionData: {
    player1Score: number;
    player2Score: number;
    player1Minefield: string;
    player2Minefield: string;
    player1Time: string;
    player2Time: string;
    player1Address: string;
    player2Address: string;
    winner: string;
  }) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CommitRevealPage({
  sessionId,
  roomId,
  playerAddress,
  opponentAddress,
  isCreator,
  myScore,
  myMinefield,
  myTime,
  onBothCommitted,
}: CommitRevealPageProps) {
  const [hasCommitted, setHasCommitted] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const { commitAndReveal } = useGameMutations();
  const { player1Done, player2Done, bothDone, sessionData } = useCommitRevealStatus(sessionId);

  // Determine which player we are
  const iAmPlayer1 = isCreator;
  const myDone = iAmPlayer1 ? player1Done : player2Done;
  const opponentDone = iAmPlayer1 ? player2Done : player1Done;

  // Auto-transition when both are done
  useEffect(() => {
    if (bothDone && sessionData) {
      // Compute winner from scores (avoids race condition where winner field
      // hasn't been written yet by the second committer)
      const p1Score = sessionData.player1Score ?? 0;
      const p2Score = sessionData.player2Score ?? 0;
      const computedWinner = p1Score > p2Score
        ? sessionData.player1Address
        : p2Score > p1Score
          ? sessionData.player2Address
          : 'tie';

      onBothCommitted({
        player1Score: p1Score,
        player2Score: p2Score,
        player1Minefield: sessionData.player1Minefield ?? '[]',
        player2Minefield: sessionData.player2Minefield ?? '[]',
        player1Time: sessionData.player1Time ?? '00:00',
        player2Time: sessionData.player2Time ?? '00:00',
        player1Address: sessionData.player1Address,
        player2Address: sessionData.player2Address,
        winner: sessionData.winner || computedWinner,
      });
    }
  }, [bothDone, sessionData, onBothCommitted]);

  const handleCommitReveal = async () => {
    if (hasCommitted || isCommitting) return;

    setIsCommitting(true);
    try {
      // Serialize minefield snapshot
      const minefieldJson = JSON.stringify(myMinefield);

      const success = await commitAndReveal(
        sessionId,
        roomId,
        playerAddress,
        myScore,
        minefieldJson,
        myTime
      );

      if (success) {
        setHasCommitted(true);
      }
    } catch (err) {
      console.error('Error committing and revealing:', err);
    } finally {
      setIsCommitting(false);
    }
  };

  const player1Label = isCreator ? 'You' : opponentAddress.slice(0, 8) + '...' + opponentAddress.slice(-4);
  const player2Label = isCreator ? opponentAddress.slice(0, 8) + '...' + opponentAddress.slice(-4) : 'You';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Shield className="w-12 h-12 mx-auto" style={{ color: THEME_COLORS.flag }} />
          <h1 className="text-3xl font-black tracking-tight text-textPrimary uppercase">
            Commit & Reveal
          </h1>
          <p className="text-sm text-textSecondary">
            Both players must confirm their results to proceed to the summary.
          </p>
        </div>

        {/* Player Status Cards */}
        <div
          className="p-6 rounded-xl space-y-6"
          style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
        >
          {/* Player 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: (iAmPlayer1 ? myDone : opponentDone) ? THEME_COLORS.safe : THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary,
                }}
              >
                P1
              </div>
              <div>
                <p className="font-semibold text-textPrimary text-sm">{player1Label}</p>
                <p className="text-xs text-textSecondary">Player 1</p>
              </div>
            </div>
            <div>
              {player1Done ? (
                <Check className="w-6 h-6" style={{ color: THEME_COLORS.safe }} />
              ) : (
                <X className="w-6 h-6" style={{ color: THEME_COLORS.mine }} />
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: THEME_COLORS.border }} />

          {/* Player 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: (iAmPlayer1 ? opponentDone : myDone) ? THEME_COLORS.safe : THEME_COLORS.border,
                  color: THEME_COLORS.textPrimary,
                }}
              >
                P2
              </div>
              <div>
                <p className="font-semibold text-textPrimary text-sm">{player2Label}</p>
                <p className="text-xs text-textSecondary">Player 2</p>
              </div>
            </div>
            <div>
              {player2Done ? (
                <Check className="w-6 h-6" style={{ color: THEME_COLORS.safe }} />
              ) : (
                <X className="w-6 h-6" style={{ color: THEME_COLORS.mine }} />
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          {hasCommitted || myDone ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: THEME_COLORS.flag }} />
                <span className="text-textSecondary font-semibold">
                  {opponentDone ? 'Proceeding...' : 'Waiting for another player...'}
                </span>
              </div>
              <p className="text-xs text-textSecondary">
                Your results have been committed and revealed on-chain.
              </p>
            </div>
          ) : (
            <button
              onClick={handleCommitReveal}
              disabled={isCommitting}
              className="w-full py-4 px-8 rounded-xl font-bold text-lg uppercase tracking-wide transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: THEME_COLORS.safe,
                color: THEME_COLORS.background,
              }}
            >
              {isCommitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Committing...
                </span>
              ) : (
                'COMMIT & REVEAL'
              )}
            </button>
          )}
        </div>

        {/* Score Preview */}
        <div
          className="p-4 rounded-lg text-center"
          style={{ backgroundColor: THEME_COLORS.background, border: `1px solid ${THEME_COLORS.border}` }}
        >
          <p className="text-xs text-textSecondary uppercase tracking-wider mb-1">Your Score</p>
          <p className="text-3xl font-black" style={{ color: THEME_COLORS.safe }}>
            {myScore}
          </p>
          <p className="text-xs text-textSecondary mt-1">Time: {myTime}</p>
        </div>
      </div>
    </div>
  );
}
