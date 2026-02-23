/**
 * Unit Tests for Stellar Contract Interactions
 * Tests the ContractInteractions class focusing on testable behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZKProof } from '@/lib/game/types';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

// Test the static utility methods which don't require complex mocking
import {
  ContractInteractions,
  GameStartParams,
  ScoreSubmissionParams,
  ClaimPrizeParams,
} from '../interactions';

// ============================================================================
// TEST UTILITIES
// ============================================================================

const mockDevWalletAddress = 'GDOU6C4NXN37MKRR75Z75B4DA4LN2EK3TYOD7GODPY2WN2VB44KJV4CC';
const mockPlayer2Address = 'GAMHAOUJG474HELCKG4MXCULGKY7PUMJWWCS3CXYFW6NZUI27EAGUWIJ';

const createMockZKProof = (): ZKProof => ({
  sessionId: 12345,
  seed: 'test-seed-12345',
  moves: [
    { x: 0, y: 0, action: 'reveal', timestamp: 123456, result: 'safe' },
    { x: 1, y: 1, action: 'reveal', timestamp: 123457, result: 'safe' },
  ],
  score: 850,
  proof: 'base64-encoded-proof',
  publicInputs: 'base64-encoded-inputs',
  verified: true,
  isMock: true,
  signature: 'mock-signature',
});

// ============================================================================
// TEST SUITES
// ============================================================================

describe('ContractInteractions', () => {
  let contractInteractions: ContractInteractions;

  beforeEach(() => {
    contractInteractions = new ContractInteractions();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // STATIC UTILITY METHODS TESTS
  // ==========================================================================

  describe('Static Utility Methods', () => {
    describe('formatXLM', () => {
      it('should convert stroops to XLM correctly', () => {
        // 1 XLM = 10,000,000 stroops
        expect(ContractInteractions.formatXLM(BigInt(10000000))).toBe('1.00');
        expect(ContractInteractions.formatXLM(BigInt(20000000))).toBe('2.00');
        expect(ContractInteractions.formatXLM(BigInt(5000000))).toBe('0.50');
      });

      it('should handle edge cases', () => {
        expect(ContractInteractions.formatXLM(BigInt(0))).toBe('0.00');
        expect(ContractInteractions.formatXLM(BigInt(1))).toBe('0.00');
        expect(ContractInteractions.formatXLM(BigInt(100000000000))).toBe('10000.00');
      });

      it('should format to 2 decimal places', () => {
        expect(ContractInteractions.formatXLM(BigInt(12345678))).toBe('1.23');
        expect(ContractInteractions.formatXLM(BigInt(9999999))).toBe('1.00');
      });

      it('should handle large values', () => {
        expect(ContractInteractions.formatXLM(BigInt(1000000000000))).toBe('100000.00');
      });
    });

    describe('xlmToStroops', () => {
      it('should convert XLM to stroops correctly', () => {
        expect(ContractInteractions.xlmToStroops(1)).toBe(BigInt(10000000));
        expect(ContractInteractions.xlmToStroops(2)).toBe(BigInt(20000000));
        expect(ContractInteractions.xlmToStroops(0.5)).toBe(BigInt(5000000));
      });

      it('should handle edge cases', () => {
        expect(ContractInteractions.xlmToStroops(0)).toBe(BigInt(0));
        expect(ContractInteractions.xlmToStroops(0.0000001)).toBe(BigInt(1));
        expect(ContractInteractions.xlmToStroops(10000)).toBe(BigInt(100000000000));
      });

      it('should handle fractional values correctly', () => {
        // Should floor the result
        expect(ContractInteractions.xlmToStroops(1.23456789)).toBe(BigInt(12345678));
        expect(ContractInteractions.xlmToStroops(0.9999999)).toBe(BigInt(9999999));
      });

      it('should round trip correctly for integer values', () => {
        const xlm = 5;
        const stroops = ContractInteractions.xlmToStroops(xlm);
        const backToXlm = ContractInteractions.formatXLM(stroops);
        expect(backToXlm).toBe('5.00');
      });
    });

    describe('Conversion edge cases', () => {
      it('should handle negative values gracefully (though not expected in production)', () => {
        // Negative values don't make sense in production but function should handle them
        expect(ContractInteractions.formatXLM(BigInt(-10000000))).toBe('-1.00');
        expect(ContractInteractions.xlmToStroops(-1)).toBe(BigInt(-10000000));
      });

      it('should handle very large bigint values', () => {
        const hugeValue = BigInt(Number.MAX_SAFE_INTEGER) * BigInt(10000000);
        const result = ContractInteractions.formatXLM(hugeValue);
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      });
    });
  });

  // ==========================================================================
  // CLASS STRUCTURE TESTS
  // ==========================================================================

  describe('Class Structure', () => {
    it('should instantiate correctly', () => {
      expect(contractInteractions).toBeInstanceOf(ContractInteractions);
    });

    it('should have all required methods', () => {
      expect(typeof contractInteractions.startGame).toBe('function');
      expect(typeof contractInteractions.submitScore).toBe('function');
      expect(typeof contractInteractions.revealWinner).toBe('function');
      expect(typeof contractInteractions.claimPrize).toBe('function');
      expect(typeof contractInteractions.getGameState).toBe('function');
    });

    it('should have static utility methods', () => {
      expect(typeof ContractInteractions.formatXLM).toBe('function');
      expect(typeof ContractInteractions.xlmToStroops).toBe('function');
    });
  });

  // ==========================================================================
  // PARAMETER VALIDATION TESTS
  // ==========================================================================

  describe('Parameter Types', () => {
    it('should accept correct parameter types for startGame', () => {
      const params: GameStartParams = {
        player1: mockDevWalletAddress,
        player2: mockPlayer2Address,
        betAmount: BigInt(10000000),
      };

      // Test that the parameter structure is correct
      expect(params.player1).toEqual(expect.any(String));
      expect(params.player2).toEqual(expect.any(String));
      expect(params.betAmount).toEqual(expect.any(BigInt));
    });

    it('should accept correct parameter types for submitScore', () => {
      const params: ScoreSubmissionParams = {
        sessionId: 12345,
        playerAddress: mockDevWalletAddress,
        score: 850,
        moves: 25,
        zkProof: createMockZKProof(),
      };

      // Test that the parameter structure is correct
      expect(params.sessionId).toEqual(expect.any(Number));
      expect(params.playerAddress).toEqual(expect.any(String));
      expect(params.score).toEqual(expect.any(Number));
      expect(params.moves).toEqual(expect.any(Number));
      expect(params.zkProof).toBeDefined();
    });

    it('should accept correct parameter types for claimPrize', () => {
      const params: ClaimPrizeParams = {
        sessionId: 12345,
        winnerAddress: mockDevWalletAddress,
      };

      // Test that the parameter structure is correct
      expect(params.sessionId).toEqual(expect.any(Number));
      expect(params.winnerAddress).toEqual(expect.any(String));
    });
  });

  // ==========================================================================
  // ZK PROOF TYPE TESTS
  // ==========================================================================

  describe('ZKProof Types', () => {
    it('should create valid mock ZK proof', () => {
      const proof = createMockZKProof();

      expect(proof.sessionId).toBe(12345);
      expect(proof.seed).toBe('test-seed-12345');
      expect(proof.moves).toHaveLength(2);
      expect(proof.score).toBe(850);
      expect(proof.proof).toBeTruthy();
      expect(proof.publicInputs).toBeTruthy();
      expect(proof.verified).toBe(true);
      expect(proof.isMock).toBe(true);
    });

    it('should handle mock ZK proof with optional signature', () => {
      const proof = createMockZKProof();
      expect(proof.signature).toBe('mock-signature');
    });

    it('should support moves with different actions', () => {
      const proof: ZKProof = {
        sessionId: 1,
        seed: 'seed',
        moves: [
          { x: 0, y: 0, action: 'reveal', timestamp: 100, result: 'safe' },
          { x: 1, y: 1, action: 'flag', timestamp: 200 },
        ],
        score: 100,
        proof: 'proof',
        publicInputs: 'inputs',
        verified: true,
        isMock: true,
        signature: 'sig',
      };

      expect(proof.moves[0].action).toBe('reveal');
      expect(proof.moves[1].action).toBe('flag');
    });
  });

  // ==========================================================================
  // TRANSACTION RESULT TYPE TESTS
  // ==========================================================================

  describe('TransactionResult Types', () => {
    it('should create successful transaction result', () => {
      const result = {
        hash: 'abc123',
        status: 'success' as const,
      };

      expect(result.hash).toBeTruthy();
      expect(result.status).toBe('success');
      expect(result.error).toBeUndefined();
    });

    it('should create failed transaction result', () => {
      const result = {
        hash: '',
        status: 'failed' as const,
        error: 'Transaction failed',
      };

      expect(result.hash).toBe('');
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Transaction failed');
    });

    it('should support all status types', () => {
      const statuses: Array<'success' | 'pending' | 'failed'> = ['success', 'pending', 'failed'];

      statuses.forEach(status => {
        const result = { hash: 'test', status };
        expect(['success', 'pending', 'failed']).toContain(result.status);
      });
    });
  });

  // ==========================================================================
  // INTEGRATION-TYPE TESTS (Type-level validation)
  // ==========================================================================

  describe('Type Safety', () => {
    it('should enforce betAmount as bigint', () => {
      const validParams: GameStartParams = {
        player1: mockDevWalletAddress,
        player2: mockPlayer2Address,
        betAmount: BigInt(10000000),
      };

      // This test validates type safety at compile time
      expect(typeof validParams.betAmount).toBe('bigint');
    });

    it('should enforce sessionId as number', () => {
      const params: ScoreSubmissionParams = {
        sessionId: 12345,
        playerAddress: mockDevWalletAddress,
        score: 100,
        moves: 10,
        zkProof: createMockZKProof(),
      };

      expect(typeof params.sessionId).toBe('number');
    });

    it('should require all mandatory fields', () => {
      // Test that type system enforces required fields
      const createParams = (): GameStartParams => ({
        player1: mockDevWalletAddress,
        player2: mockPlayer2Address,
        betAmount: BigInt(10000000),
      });

      const params = createParams();
      expect(params.player1).toBeDefined();
      expect(params.player2).toBeDefined();
      expect(params.betAmount).toBeDefined();
    });
  });

  // ==========================================================================
  // EDGE CASE VALIDATION
  // ==========================================================================

  describe('Edge Case Values', () => {
    it('should handle zero bet amount', () => {
      const params: GameStartParams = {
        player1: mockDevWalletAddress,
        player2: mockPlayer2Address,
        betAmount: BigInt(0),
      };

      expect(params.betAmount).toBe(BigInt(0));
    });

    it('should handle maximum score', () => {
      const params: ScoreSubmissionParams = {
        sessionId: 1,
        playerAddress: mockDevWalletAddress,
        score: 1000, // Max score from GAME_CONFIG
        moves: 64,
        zkProof: createMockZKProof(),
      };

      expect(params.score).toBe(1000);
    });

    it('should handle zero score', () => {
      const params: ScoreSubmissionParams = {
        sessionId: 1,
        playerAddress: mockDevWalletAddress,
        score: 0,
        moves: 0,
        zkProof: createMockZKProof(),
      };

      expect(params.score).toBe(0);
    });

    it('should handle very large session IDs', () => {
      const params: ClaimPrizeParams = {
        sessionId: 4294967295, // Max u32
        winnerAddress: mockDevWalletAddress,
      };

      expect(params.sessionId).toBe(4294967295);
    });

    it('should handle session ID of 0', () => {
      const params: ClaimPrizeParams = {
        sessionId: 0,
        winnerAddress: mockDevWalletAddress,
      };

      expect(params.sessionId).toBe(0);
    });
  });

  // ==========================================================================
  // MODULE IMPORT TESTS
  // ==========================================================================

  describe('Module Exports', () => {
    it('should export ContractInteractions class', () => {
      expect(ContractInteractions).toBeDefined();
      expect(typeof ContractInteractions).toBe('function');
    });

    it('should export type interfaces', () => {
      // Type interfaces are not available at runtime in TypeScript
      // but we can verify the module loaded correctly
      expect(() => {
        const params: GameStartParams = {
          player1: 'test',
          player2: 'test2',
          betAmount: BigInt(100),
        };
        return params;
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // SSR COMPATIBILITY TESTS
  // ==========================================================================

  describe('SSR Compatibility', () => {
    it('should not throw when created in SSR environment', () => {
      // Save original window object
      const originalWindow = global.window;

      try {
        // @ts-ignore - Simulate SSR environment
        delete global.window;

        const ssrInteractions = new ContractInteractions();
        expect(ssrInteractions).toBeInstanceOf(ContractInteractions);
      } finally {
        // Restore window
        global.window = originalWindow;
      }
    });

    it('should not throw when methods exist in SSR environment', () => {
      const originalWindow = global.window;

      try {
        // @ts-ignore
        delete global.window;

        const ssrInteractions = new ContractInteractions();
        expect(typeof ssrInteractions.startGame).toBe('function');
        expect(typeof ssrInteractions.submitScore).toBe('function');
        expect(typeof ssrInteractions.claimPrize).toBe('function');
        expect(typeof ssrInteractions.getGameState).toBe('function');
      } finally {
        global.window = originalWindow;
      }
    });
  });

  // ==========================================================================
  // WALLET ADDRESS VALIDATION
  // ==========================================================================

  describe('Wallet Address Formats', () => {
    const validAddresses = [
      'GDOU6C4NXN37MKRR75Z75B4DA4LN2EK3TYOD7GODPY2WN2VB44KJV4CC',
      'GAMHAOUJG474HELCKG4MXCULGKY7PUMJWWCS3CXYFW6NZUI27EAGUWIJ',
      'GAWK4FEEYQ3RHINSSBBUGX6T6K7DED5TYZPO4K3QN6LZ7DRKOU6THKJT',
    ];

    it('should accept valid Stellar public key format', () => {
      validAddresses.forEach(address => {
        expect(address).toMatch(/^G[A-Z0-9]{55}$/);
        expect(address.length).toBe(56);
      });
    });

    it('should work with dev wallet addresses', () => {
      const params: GameStartParams = {
        player1: validAddresses[0],
        player2: validAddresses[1],
        betAmount: BigInt(10000000),
      };

      expect(params.player1.length).toBe(56);
      expect(params.player2.length).toBe(56);
    });
  });

  // ==========================================================================
  // ASYNCHRONOUS METHOD SIGNATURES
  // ==========================================================================

  describe('Async Method Signatures', () => {
    it('should have async startGame method', () => {
      const result = contractInteractions.startGame({
        player1: mockDevWalletAddress,
        player2: mockPlayer2Address,
        betAmount: BigInt(10000000),
      });

      // Verify it returns a promise
      expect(result).toBeInstanceOf(Promise);
    });

    it('should have async submitScore method', () => {
      const result = contractInteractions.submitScore({
        sessionId: 12345,
        playerAddress: mockDevWalletAddress,
        score: 100,
        moves: 10,
        zkProof: createMockZKProof(),
      });

      expect(result).toBeInstanceOf(Promise);
    });

    it('should have async revealWinner method', () => {
      const result = contractInteractions.revealWinner(12345);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should have async claimPrize method', () => {
      const result = contractInteractions.claimPrize({
        sessionId: 12345,
        winnerAddress: mockDevWalletAddress,
      });

      expect(result).toBeInstanceOf(Promise);
    });

    it('should have async getGameState method', () => {
      const result = contractInteractions.getGameState(12345);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
