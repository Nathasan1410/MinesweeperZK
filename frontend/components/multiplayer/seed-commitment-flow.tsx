/**
 * Seed Commitment Flow Component
 * Manages the commit-reveal protocol for multiplayer games
 */

'use client';

import { useEffect, useState } from 'react';
import { Lock, Unlock, Check, Loader2 } from 'lucide-react';
import { useSeedCommitment, useCombinedSeed } from '@/hooks/use-firebase-game';
import { useMinesweeperStore } from '@/lib/game/store';
import { THEME_COLORS } from '@/lib/game/types';

interface SeedCommitmentFlowProps {
  roomId: string | null;
  playerAddress: string | null;
  onComplete: (seed: string) => void;
}

export function SeedCommitmentFlow({
  roomId,
  playerAddress,
  onComplete,
}: SeedCommitmentFlowProps) {
  const { commitSeed, revealSeed, localCommit, isCommitting, isRevealing, opponentCommit } = useSeedCommitment(roomId, playerAddress);
  const { combinedSeed, generateSeed, canGenerate, isGenerating } = useCombinedSeed(roomId);
  const [phase, setPhase] = useState<'commit' | 'waiting_opponent' | 'reveal' | 'done'>('commit');
  const [generatedSeed, setGeneratedSeed] = useState<string | null>(null);

  const setPhaseInStore = useMinesweeperStore((s) => s.setPhase);
  const setSeedInStore = useMinesweeperStore((s) => s.setSeed);

  // Update store phase (only for valid GamePhase values)
  useEffect(() => {
    if (phase !== 'done') {
      setPhaseInStore(phase);
    }
  }, [phase, setPhaseInStore]);

  const handleCommit = async () => {
    const success = await commitSeed();
    if (success) {
      console.log('[SeedCommitmentFlow] Commit successful, moving to waiting_opponent phase');
      setPhase('waiting_opponent');
    } else {
      console.error('[SeedCommitmentFlow] Commit failed');
    }
  };

  const handleReveal = async () => {
    const success = await revealSeed();
    if (success) {
      setPhase('reveal');
    }
  };

  const handleGenerateSeed = async () => {
    const seed = await generateSeed();
    if (seed) {
      setGeneratedSeed(seed);
      setSeedInStore(seed);
      setPhase('done');
      onComplete(seed);
    }
  };

  // Auto-generate seed when both revealed
  useEffect(() => {
    if (canGenerate && phase === 'reveal') {
      handleGenerateSeed();
    }
  }, [canGenerate, phase]);

  // Auto-transition from waiting_opponent to reveal when both players have committed
  useEffect(() => {
    if (phase === 'waiting_opponent' && localCommit && opponentCommit) {
      console.log('[SeedCommitmentFlow] Both players committed, transitioning to reveal phase');
      setPhase('reveal');
    }
  }, [phase, localCommit, opponentCommit]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Phase Indicator */}
      <div className="flex items-center gap-4">
        <PhaseStep
          icon={<Lock className="w-5 h-5" />}
          label="Commit"
          active={phase === 'commit'}
          completed={phase !== 'commit'}
        />
        <div className="w-8 h-0.5 bg-border" />
        <PhaseStep
          icon={<Loader2 className="w-5 h-5" />}
          label="Wait"
          active={phase === 'waiting_opponent'}
          completed={phase === 'reveal' || phase === 'done'}
        />
        <div className="w-8 h-0.5 bg-border" />
        <PhaseStep
          icon={<Unlock className="w-5 h-5" />}
          label="Reveal"
          active={phase === 'reveal'}
          completed={phase === 'done'}
        />
      </div>

      {/* Content based on phase */}
      {phase === 'commit' && (
        <CommitPhaseContent
          isCommitting={isCommitting}
          onCommit={handleCommit}
        />
      )}

      {phase === 'waiting_opponent' && localCommit && (
        <WaitPhaseContent
          localCommit={localCommit}
          canReveal={opponentCommit !== null}
          onReveal={handleReveal}
        />
      )}

      {phase === 'reveal' && (
        isGenerating ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-safe" />
            <p className="text-textPrimary">Generating combined seed...</p>
          </div>
        ) : (
          <RevealPhaseContent
            isRevealing={isRevealing}
            onReveal={handleReveal}
            opponentRevealed={!!localCommit}
          />
        )
      )}

      {phase === 'done' && generatedSeed && (
        <DonePhaseContent seed={generatedSeed} />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PhaseStep({
  icon,
  label,
  active,
  completed,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          active ? 'bg-safe text-background' : completed ? 'bg-safe/20 text-safe' : 'bg-surface text-textSecondary'
        }`}
      >
        {completed ? <Check className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs ${active || completed ? 'text-safe' : 'text-textSecondary'}`}>
        {label}
      </span>
    </div>
  );
}

function CommitPhaseContent({
  isCommitting,
  onCommit,
}: {
  isCommitting: boolean;
  onCommit: () => void;
}) {
  return (
    <div className="text-center space-y-4 max-w-md">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <Lock className="w-8 h-8 text-safe" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-textPrimary">Commit Your Seed</h3>
        <p className="text-textSecondary mt-2">
          Generate a random seed and commit its hash. This ensures fairness by preventing either player from changing their seed later.
        </p>
      </div>

      <button
        onClick={onCommit}
        disabled={isCommitting}
        className="px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
        style={{
          backgroundColor: isCommitting ? THEME_COLORS.surface : THEME_COLORS.safe,
          color: isCommitting ? THEME_COLORS.textSecondary : THEME_COLORS.background,
        }}
      >
        {isCommitting ? 'Committing...' : 'Generate & Commit Seed'}
      </button>

      <div className="text-xs text-textSecondary p-3 rounded-lg bg-surface">
        <strong>How it works:</strong> Your seed is hidden and only its hash is submitted. Once both players commit, you will reveal your actual seed, and they will be combined to generate the minefield.
      </div>
    </div>
  );
}

function WaitPhaseContent({
  localCommit,
  canReveal,
  onReveal,
}: {
  localCommit: { hash: string };
  canReveal: boolean;
  onReveal: () => void;
}) {
  return (
    <div className="text-center space-y-4 max-w-md">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <Loader2 className="w-8 h-8 text-flag animate-spin" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-textPrimary">Waiting for Opponent</h3>
        <p className="text-textSecondary mt-2">
          Your seed has been committed. Waiting for your opponent to commit theirs.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-surface space-y-2">
        <div className="text-xs text-textSecondary">Your Commit Hash:</div>
        <div className="font-mono text-sm text-safe break-all">
          {localCommit.hash.slice(0, 32)}...
        </div>
      </div>

      {canReveal && (
        <button
          onClick={onReveal}
          className="px-8 py-3 rounded-lg font-semibold transition-all"
          style={{
            backgroundColor: THEME_COLORS.flag,
            color: THEME_COLORS.background,
          }}
        >
          Reveal Seed
        </button>
      )}
    </div>
  );
}

function RevealPhaseContent({
  isRevealing,
  onReveal,
  opponentRevealed,
}: {
  isRevealing: boolean;
  onReveal: () => void;
  opponentRevealed: boolean;
}) {
  return (
    <div className="text-center space-y-4 max-w-md">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: THEME_COLORS.surface }}
      >
        <Unlock className="w-8 h-8 text-safe" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-textPrimary">Reveal Your Seed</h3>
        <p className="text-textSecondary mt-2">
          Both players have committed. Now reveal your actual seed to generate the combined minefield.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-surface space-y-2">
        <div className="text-xs text-textSecondary">
          {opponentRevealed ? "Opponent revealed their seed" : "Waiting for opponent to reveal..."}
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${opponentRevealed ? 'bg-safe' : 'bg-textSecondary'}`} />
          <div className="w-8 h-0.5 bg-textSecondary" />
          <div className={`w-3 h-3 rounded-full ${false ? 'bg-safe' : 'bg-textSecondary'}`} />
        </div>
      </div>

      <button
        onClick={onReveal}
        disabled={isRevealing}
        className="px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
        style={{
          backgroundColor: isRevealing ? THEME_COLORS.surface : THEME_COLORS.safe,
          color: isRevealing ? THEME_COLORS.textSecondary : THEME_COLORS.background,
        }}
      >
        {isRevealing ? 'Revealing...' : 'Reveal My Seed'}
      </button>

      <div className="text-xs text-textSecondary p-3 rounded-lg bg-surface">
        <strong>Why reveal?</strong> Your seed will be combined with your opponent's seed to create a fair minefield that neither player could predict.
      </div>
    </div>
  );
}

function DonePhaseContent({ seed }: { seed: string }) {
  return (
    <div className="text-center space-y-4 max-w-md">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: `${THEME_COLORS.safe}/20` }}
      >
        <Check className="w-8 h-8 text-safe" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-textPrimary">Seed Generated!</h3>
        <p className="text-textSecondary mt-2">
          Both players have revealed their seeds. The combined seed has been generated and the minefield is ready.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-surface space-y-2">
        <div className="text-xs text-textSecondary">Combined Seed:</div>
        <div className="font-mono text-sm text-safe break-all">
          {seed}
        </div>
      </div>
    </div>
  );
}
