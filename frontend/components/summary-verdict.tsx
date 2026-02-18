'use client';

import { useState, useEffect } from 'react';
import { Copy, ExternalLink, CheckCircle, XCircle, Bomb, Flag, X } from 'lucide-react';

interface SummaryVerdictProps {
  isWinner: boolean;
  winAmount?: number;
  gameId: string;
  totalMoves: number;
  seedHash: string;
  txHash: string;
  board: (number | null)[][];
  playerFlags: boolean[][];
  onFindNewMatch: () => void;
  onBackToLobby: () => void;
}

export function SummaryVerdict({
  isWinner,
  winAmount = 19.5,
  gameId,
  totalMoves,
  seedHash,
  txHash,
  board,
  playerFlags,
  onFindNewMatch,
  onBackToLobby,
}: SummaryVerdictProps) {
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

  const truncateHash = (hash: string) => {
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Result Header */}
      <div
        className={`mb-12 text-center transform transition-all duration-500 ${
          animate ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
      >
        {isWinner ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle
                size={64}
                className="text-success"
                strokeWidth={1.5}
              />
            </div>
            <h1
              className="text-5xl font-black mb-2 uppercase tracking-tight"
              style={{ color: '#538D4E', letterSpacing: '0.08em' }}
            >
              VICTORY SECURED
            </h1>
            <p
              className="text-xl font-semibold"
              style={{ color: '#538D4E', letterSpacing: '0.05em' }}
            >
              +{winAmount} XLM SENT TO WALLET
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <XCircle
                size={64}
                className="text-error"
                strokeWidth={1.5}
              />
            </div>
            <h1
              className="text-5xl font-black mb-2 uppercase tracking-tight"
              style={{ color: '#DA4F49', letterSpacing: '0.08em' }}
            >
              DEFEAT
            </h1>
            <p
              className="text-xl font-semibold"
              style={{ color: '#DA4F49', letterSpacing: '0.05em' }}
            >
              -{winAmount} XLM
            </p>
          </>
        )}
      </div>

      {/* Proof of Fairness Receipt */}
      <div
        className={`mb-12 w-full max-w-2xl transform transition-all duration-700 delay-100 ${
          animate ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
      >
        <div
          className="p-6 border-2 border-dashed"
          style={{
            backgroundColor: '#1A1A1B',
            borderColor: '#3A3A3C',
          }}
        >
          <h2
            className="text-xs font-black uppercase mb-4"
            style={{
              color: '#818384',
              letterSpacing: '0.15em',
            }}
          >
            PROOF OF FAIRNESS
          </h2>

          <div className="space-y-4 font-mono text-sm">
            {/* Game ID */}
            <div className="flex items-center justify-between">
              <span style={{ color: '#818384' }}>Game ID:</span>
              <span className="text-foreground">#{gameId}</span>
            </div>

            {/* Total Moves */}
            <div className="flex items-center justify-between">
              <span style={{ color: '#818384' }}>Total Moves:</span>
              <span className="text-foreground">{totalMoves}</span>
            </div>

            {/* Seed Hash */}
            <div className="flex items-center justify-between gap-2">
              <span style={{ color: '#818384' }}>Seed Hash:</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground">{truncateHash(seedHash)}</span>
                <button
                  onClick={() => handleCopy(seedHash, 'seedHash')}
                  className="p-1 hover:bg-surface transition-colors"
                  title="Copy seed hash"
                >
                  <Copy size={14} style={{ color: '#818384' }} />
                </button>
              </div>
            </div>

            {/* ZK Proof */}
            <div className="flex items-center justify-between">
              <span style={{ color: '#818384' }}>ZK Proof:</span>
              <span style={{ color: '#538D4E' }} className="font-semibold">
                Verified ✓
              </span>
            </div>

            {/* TX Hash */}
            <div className="flex items-center justify-between gap-2">
              <span style={{ color: '#818384' }}>Tx Hash:</span>
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  className="text-foreground hover:opacity-70 transition-opacity"
                  style={{ textDecoration: 'underline', color: '#538D4E' }}
                >
                  {truncateHash(txHash)}
                </a>
                <ExternalLink
                  size={14}
                  style={{ color: '#818384' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board Reveal */}
      <div
        className={`mb-12 w-full max-w-2xl transform transition-all duration-700 delay-200 ${
          animate ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
      >
        <h2
          className="text-xs font-black uppercase mb-4"
          style={{
            color: '#818384',
            letterSpacing: '0.15em',
          }}
        >
          FINAL BOARD STATE
        </h2>

        <div
          className={`p-4 border-2 relative ${!isWinner ? 'opacity-75' : ''}`}
          style={{
            backgroundColor: '#1A1A1B',
            borderColor: '#3A3A3C',
          }}
        >
          {!isWinner && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span
                className="text-lg font-black uppercase"
                style={{ color: '#DA4F49', letterSpacing: '0.08em' }}
              >
                GAME OVER
              </span>
            </div>
          )}

          <div className="grid gap-0" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
            {board.map((row, rowIdx) =>
              row.map((cell, colIdx) => {
                const isMine = cell === -1;
                const isFlag = playerFlags[rowIdx]?.[colIdx];
                const isCorrectFlag = isFlag && isMine;
                const isFalseFlag = isFlag && !isMine;

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className="w-10 h-10 flex items-center justify-center border text-xs font-semibold"
                    style={{
                      borderColor: '#3A3A3C',
                      backgroundColor: isMine
                        ? '#DA4F49'
                        : isCorrectFlag
                          ? '#538D4E'
                          : cell === 0
                            ? '#1A1A1B'
                            : '#2A2A2C',
                      color: isMine ? '#000' : isCorrectFlag ? '#fff' : '#F8F9FA',
                    }}
                  >
                    {isMine && !isFlag && <Bomb className="w-4 h-4" />}
                    {isCorrectFlag && <Flag className="w-4 h-4" />}
                    {isFalseFlag && <X className="w-4 h-4" />}
                    {!isMine && !isFlag && cell !== null && cell > 0 && cell}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className={`flex gap-4 transform transition-all duration-700 delay-300 ${
          animate ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
      >
        <button
          onClick={onFindNewMatch}
          className="px-8 py-3 border-2 font-bold uppercase text-sm transition-colors"
          style={{
            backgroundColor: '#F8F9FA',
            color: '#121213',
            borderColor: '#F8F9FA',
            letterSpacing: '0.06em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E0E0E0';
            e.currentTarget.style.borderColor = '#E0E0E0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F8F9FA';
            e.currentTarget.style.borderColor = '#F8F9FA';
          }}
        >
          FIND NEW MATCH
        </button>

        <button
          onClick={onBackToLobby}
          className="px-8 py-3 border-2 font-bold uppercase text-sm transition-colors"
          style={{
            backgroundColor: 'transparent',
            color: '#F8F9FA',
            borderColor: '#818384',
            letterSpacing: '0.06em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#F8F9FA';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#818384';
          }}
        >
          BACK TO LOBBY
        </button>
      </div>

      {/* Copy Feedback */}
      {copied && (
        <div
          className="fixed bottom-8 right-8 px-4 py-2 border text-sm font-semibold"
          style={{
            backgroundColor: '#1A1A1B',
            borderColor: '#538D4E',
            color: '#538D4E',
          }}
        >
          COPIED
        </div>
      )}
    </div>
  );
}
