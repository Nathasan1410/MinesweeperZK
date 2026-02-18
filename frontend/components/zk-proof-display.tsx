/**
 * ZK Proof Display Component
 * Shows the ZK proof verification animation and status
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Shield, AlertCircle } from 'lucide-react';

interface ZKProofDisplayProps {
  isVerifying: boolean;
  isVerified: boolean;
  proofId?: string;
  error?: string;
  className?: string;
}

export function ZKProofDisplay({
  isVerifying,
  isVerified,
  proofId,
  error,
  className = '',
}: ZKProofDisplayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isVerifying) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (isVerified) {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [isVerifying, isVerified]);

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${
      isVerified
        ? 'bg-green-950/30 border-green-800'
        : isVerifying
        ? 'bg-yellow-950/30 border-yellow-800'
        : error
        ? 'bg-red-950/30 border-red-800'
        : 'bg-surface border-border'
    } ${className}`}>
      {/* Icon */}
      <div className="flex-shrink-0">
        {isVerified ? (
          <CheckCircle2 className="w-6 h-6 text-safe" />
        ) : isVerifying ? (
          <Loader2 className="w-6 h-6 text-flag animate-spin" />
        ) : error ? (
          <AlertCircle className="w-6 h-6 text-mine" />
        ) : (
          <Shield className="w-6 h-6 text-textSecondary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-textPrimary">
            {isVerified
              ? 'ZK Proof Verified'
              : isVerifying
              ? 'Verifying ZK Proof...'
              : error
              ? 'Verification Failed'
              : 'Proof Pending'}
          </p>
          {proofId && (
            <span className="text-xs text-textSecondary font-mono">
              #{proofId}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {(isVerifying || isVerified) && (
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-safe transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Details */}
        {isVerifying && (
          <p className="text-xs text-textSecondary mt-1">
            Validating game moves and score computation...
          </p>
        )}
        {isVerified && (
          <p className="text-xs text-safe mt-1">
            ✓ Gameplay verified on-chain
          </p>
        )}
        {error && (
          <p className="text-xs text-mine mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Compact ZK Badge for smaller displays
 */
export function ZKProofBadge({
  isVerified,
  isVerifying,
  proofId,
}: {
  isVerified: boolean;
  isVerifying: boolean;
  proofId?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
        isVerified
          ? 'bg-green-950/50 text-safe border border-green-800'
          : isVerifying
          ? 'bg-yellow-950/50 text-flag border border-yellow-800'
          : 'bg-surface border border-border text-textSecondary'
      }`}
    >
      {isVerified ? (
        <>
          <CheckCircle2 className="w-3 h-3" />
          ZK Verified
        </>
      ) : isVerifying ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Verifying...
        </>
      ) : (
        <>
          <Shield className="w-3 h-3" />
          Pending
        </>
      )}
      {proofId && <span className="opacity-60">#{proofId}</span>}
    </div>
  );
}

/**
 * Full ZK Proof Details Panel
 */
export function ZKProofDetails({
  proof,
  showDetails = false,
}: {
  proof?: {
    proofId: string;
    createdAt: number;
    verified: boolean;
    imageId?: string;
    sessionId?: number;
    score?: number;
  };
  showDetails?: boolean;
}) {
  if (!proof) return null;

  return (
    <div className="p-4 bg-surface border border-border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-textPrimary">ZK Proof Details</h3>
        <ZKProofBadge
          isVerified={proof.verified}
          isVerifying={false}
          proofId={proof.proofId}
        />
      </div>

      {showDetails && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-textSecondary">Proof ID:</span>
            <span className="font-mono text-textPrimary">{proof.proofId}</span>
          </div>
          {proof.sessionId && (
            <div className="flex justify-between">
              <span className="text-textSecondary">Session ID:</span>
              <span className="font-mono text-textPrimary">#{proof.sessionId}</span>
            </div>
          )}
          {proof.score !== undefined && (
            <div className="flex justify-between">
              <span className="text-textSecondary">Verified Score:</span>
              <span className="font-mono text-safe">{proof.score}</span>
            </div>
          )}
          {proof.imageId && (
            <div className="flex justify-between">
              <span className="text-textSecondary">Image ID:</span>
              <span className="font-mono text-textPrimary text-xs truncate ml-2">
                {proof.imageId.slice(0, 16)}...
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-textSecondary">Created:</span>
            <span className="text-textPrimary">
              {new Date(proof.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
