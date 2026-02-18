/**
 * Mock ZK Proof System
 * A working demo implementation that simulates ZK proofs
 * Upgradeable to real RISC Zero proofs
 */

import { MockZKProof, ZKProof, PlayerMove } from '../game/types';

// ============================================================================
// MOCK PROOF GENERATION
// ============================================================================

/**
 * Generate a mock ZK proof
 * In real implementation, this would call RISC Zero to generate actual proof
 */
export async function generateMockProof(params: {
  sessionId: number;
  seed: string;
  moves: PlayerMove[];
  score: number;
}): Promise<MockZKProof> {
  // Simulate proof generation delay
  await delay(500 + Math.random() * 1000);

  // Create mock proof data
  const proofData: MockZKProof = {
    sessionId: params.sessionId,
    seed: params.seed,
    moves: params.moves,
    score: params.score,
    proof: generateMockProofHash(params),
    publicInputs: generateMockPublicInputs(params),
    verified: false,
    isMock: true,
    signature: generateMockSignature(params),
  };

  return proofData;
}

/**
 * Verify a mock ZK proof
 * In real implementation, this would call the RISC Zero verifier contract
 */
export async function verifyMockProof(proof: MockZKProof): Promise<boolean> {
  // Simulate verification delay
  await delay(300 + Math.random() * 500);

  // Mock verification - checks format consistency
  const isValid =
    proof.proof.length > 0 &&
    proof.publicInputs.length > 0 &&
    proof.signature.length === 128 && // 64 bytes hex encoded
    proof.sessionId > 0;

  return isValid;
}

/**
 * Verify a ZK proof (handles both mock and real)
 */
export async function verifyProof(proof: ZKProof): Promise<boolean> {
  if (proof.isMock) {
    return verifyMockProof(proof as MockZKProof);
  } else {
    // Real proof verification would go here
    // For now, return true for real proofs too
    return true;
  }
}

// ============================================================================
// PROOF UTILITIES
// ============================================================================

/**
 * Generate a mock proof hash
 * Simulates the output of RISC Zero proof generation
 */
function generateMockProofHash(params: {
  sessionId: number;
  seed: string;
  moves: PlayerMove[];
  score: number;
}): string {
  const input = `${params.sessionId}-${params.seed}-${params.moves.length}-${params.score}`;
  return sha256(input + '-proof');
}

/**
 * Generate mock public inputs
 * Simulates the public inputs for the verifier
 */
function generateMockPublicInputs(params: {
  sessionId: number;
  seed: string;
  moves: PlayerMove[];
  score: number;
}): string {
  const inputs = {
    sessionId: params.sessionId,
    score: params.score,
    moveCount: params.moves.length,
    seedHash: sha256(params.seed),
  };
  return btoa(JSON.stringify(inputs));
}

/**
 * Generate a mock signature
 * Simulates the cryptographic signature
 */
function generateMockSignature(params: {
  sessionId: number;
  seed: string;
  moves: PlayerMove[];
  score: number;
}): string {
  const data = `${params.sessionId}-${params.seed}-${params.score}`;
  const hash = sha256(data);
  // Return 64 bytes (128 hex chars) to mimic Ed25519 signature
  return hash.padEnd(128, '0');
}

/**
 * Create a proof receipt for display
 */
export function createProofReceipt(proof: ZKProof): {
  proofId: string;
  createdAt: number;
  verified: boolean;
  imageId?: string;
} {
  return {
    proofId: sha256(proof.proof).substring(0, 16),
    createdAt: Date.now(),
    verified: proof.verified,
    imageId: !proof.isMock ? (proof as any).imageId : undefined,
  };
}

// ============================================================================
// CRYPTO UTILITIES
// ============================================================================

/**
 * SHA-256 hash function (synchronous for demo consistency)
 */
function sha256(message: string): string {
  // Simple hash for demo purposes
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64);
}

/**
 * Delay utility for simulating async operations
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// PROOF VALIDATION
// ============================================================================

/**
 * Validate proof structure
 */
export function isValidProofStructure(proof: any): proof is ZKProof {
  return (
    proof &&
    typeof proof.sessionId === 'number' &&
    typeof proof.seed === 'string' &&
    Array.isArray(proof.moves) &&
    typeof proof.score === 'number' &&
    typeof proof.proof === 'string' &&
    typeof proof.publicInputs === 'string' &&
    typeof proof.verified === 'boolean'
  );
}

/**
 * Check if proof is mock or real
 */
export function getProofType(proof: ZKProof): 'mock' | 'real' {
  return proof.isMock ? 'mock' : 'real';
}

// ============================================================================
// PROOF SERIALIZATION
// ============================================================================

/**
 * Serialize proof for storage/transmission
 */
export function serializeProof(proof: ZKProof): string {
  return JSON.stringify(proof);
}

/**
 * Deserialize proof from storage/transmission
 */
export function deserializeProof(data: string): ZKProof | null {
  try {
    const proof = JSON.parse(data);
    if (isValidProofStructure(proof)) {
      return proof;
    }
  } catch (e) {
    console.error('Failed to deserialize proof:', e);
  }
  return null;
}

// ============================================================================
// PROOF EXPORT FOR CONTRACT
// ============================================================================

/**
 * Convert proof to contract-compatible format
 * In real implementation, this would prepare the proof for Soroban contract
 */
export function proofToContractFormat(proof: ZKProof): {
  sessionId: number;
  proofBytes: string;
  publicInputsBytes: string;
  score: number;
} {
  return {
    sessionId: proof.sessionId,
    proofBytes: proof.proof,
    publicInputsBytes: proof.publicInputs,
    score: proof.score,
  };
}

// ============================================================================
// MOCK VERIFIER CONTRACT INTERFACE
// ============================================================================

/**
 * Mock verifier that simulates contract verification
 * In production, this would call the actual Soroban verifier contract
 */
export class MockVerifierContract {
  /**
   * Verify proof on "contract"
   */
  async verifyProof(proof: ZKProof): Promise<{ success: boolean; gasUsed: number }> {
    await delay(500);

    const valid = await verifyProof(proof);

    return {
      success: valid,
      gasUsed: 150000 + Math.floor(Math.random() * 50000), // Simulated gas
    };
  }

  /**
   * Submit proof and score to contract
   */
  async submitGameResult(params: {
    sessionId: number;
    proof: ZKProof;
    score: number;
    winner: string;
  }): Promise<{ txHash: string; success: boolean }> {
    await delay(1000);

    // Generate mock transaction hash
    const txHash = 'tx_' + sha256(Date.now().toString()).substring(0, 60);

    return {
      txHash,
      success: true,
    };
  }
}

// Export singleton instance
export const mockVerifier = new MockVerifierContract();
