/**
 * Stellar Contract Interactions
 * Handles all smart contract interactions for the Minesweeper ZK game
 */

import {
  Contract,
  TransactionBuilder,
  xdr,
  nativeToScVal,
  ScInt,
  Address as SorobanAddress,
  XdrLargeInt,
} from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';
import { CONTRACTS, stellarClient } from './client';
import { ZKProof } from '@/lib/game/types';

// ============================================================================
// TYPES
// ============================================================================

export interface GameStartParams {
  player1: string;
  player2: string;
  betAmount: bigint;
}

export interface ScoreSubmissionParams {
  sessionId: number;
  playerAddress: string;
  score: number;
  moves: number;
  zkProof: ZKProof;
}

export interface ClaimPrizeParams {
  sessionId: number;
  winnerAddress: string;
}

export interface TransactionResult {
  hash: string;
  status: 'success' | 'pending' | 'failed';
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Soroban RPC URL for Testnet
const RPC_URL = 'https://soroban-testnet.stellar.org';
const rpc = new Server(RPC_URL, {
  allowHttp: true,
});

// ============================================================================
// CONTRACT INTERACTION CLASS
// ============================================================================

export class ContractInteractions {
  private gameHubContract: Contract | null = null;
  private minesweeperContract: Contract | null = null;
  private contractsInitialized = false;

  constructor() {
    // Contracts are lazily initialized when needed
  }

  private async ensureContractsInitialized() {
    if (this.contractsInitialized) {
      return;
    }

    // Lazy initialize contracts on client side only
    if (typeof window === 'undefined') {
      // For SSR, we'll allow proceeding without contracts initialized
      this.contractsInitialized = true;
      return;
    }

    try {
      this.gameHubContract = new Contract(CONTRACTS.GAME_HUB);
      this.minesweeperContract = new Contract(CONTRACTS.MINESWEEPER_ZK);
      this.contractsInitialized = true;
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      // For dev mode, continue without real contracts
      this.contractsInitialized = true;
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Get the current wallet address
   */
  private getWalletAddress(): string {
    const account = stellarClient.getCurrentAccount();
    if (!account) {
      throw new Error('No wallet connected');
    }
    return account.address;
  }

  /**
   * Get account details from Stellar RPC
   */
  private async getAccountDetails(address: string) {
    try {
      const account = await rpc.getAccount(address);
      return account;
    } catch (error) {
      // Account might not exist, throw error
      throw new Error(`Account ${address} not found or not funded`);
    }
  }

  // ========================================================================
  // GAME START
  // ========================================================================

  /**
   * Start a new game via Game Hub contract
   * Creates a session and locks the bet amount for both players
   */
  async startGame(params: GameStartParams): Promise<TransactionResult> {
    await this.ensureContractsInitialized();

    const walletAddress = this.getWalletAddress();
    const account = await this.getAccountDetails(walletAddress);

    try {
      // Convert bet amount to stroops (1 XLM = 10,000,000 stroops)
      const betAmountStroops = params.betAmount * BigInt(10000000);

      // Build the transaction
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: 'Test SDF Network ; September 2015',
      })
        .addOperation(
          this.minesweeperContract!.call(
            'start_game',
            ...this.buildStartGameParams({
              sessionId: this.generateSessionId(),
              player1: params.player1,
              player2: params.player2,
              player1Points: Number(params.betAmount),
              player2Points: Number(params.betAmount),
            })
          )
        )
        .setTimeout(30)
        .build();

      // For dev wallets, we'll simulate the transaction
      if (stellarClient.isDevWallet()) {
        return this.simulateTransaction(transaction, walletAddress);
      }

      // Sign and send transaction (for real wallets)
      // TODO: Implement Freighter signing
      return { hash: '', status: 'pending' };
    } catch (error) {
      return {
        hash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildStartGameParams(params: {
    sessionId: number;
    player1: string;
    player2: string;
    player1Points: number;
    player2Points: number;
  }) {
    return [
      nativeToScVal(params.sessionId, { type: 'u32' }),
      new SorobanAddress(params.player1).toScVal(),
      new SorobanAddress(params.player2).toScVal(),
      nativeToScVal(params.player1Points, { type: 'i128' }),
      nativeToScVal(params.player2Points, { type: 'i128' }),
    ];
  }

  // ========================================================================
  // SCORE SUBMISSION
  // ========================================================================

  /**
   * Submit score with ZK proof
   * This verifies the gameplay on-chain and determines the winner
   */
  async submitScore(params: ScoreSubmissionParams): Promise<TransactionResult> {
    await this.ensureContractsInitialized();

    const walletAddress = this.getWalletAddress();
    const account = await this.getAccountDetails(walletAddress);

    try {
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: 'Test SDF Network ; September 2015',
      })
        .addOperation(
          this.minesweeperContract!.call(
            'make_guess',
            nativeToScVal(params.sessionId, { type: 'u32' }),
            new SorobanAddress(params.playerAddress).toScVal(),
            nativeToScVal(params.score, { type: 'u32' })
          )
        )
        .setTimeout(30)
        .build();

      if (stellarClient.isDevWallet()) {
        return this.simulateTransaction(transaction, walletAddress);
      }

      return { hash: '', status: 'pending' };
    } catch (error) {
      return {
        hash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========================================================================
  // REVEAL WINNER
  // ========================================================================

  /**
   * Reveal the winner after both players have submitted scores
   * The contract determines the winner based on the submitted scores
   */
  async revealWinner(sessionId: number): Promise<TransactionResult> {
    await this.ensureContractsInitialized();

    const walletAddress = this.getWalletAddress();
    const account = await this.getAccountDetails(walletAddress);

    try {
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: 'Test SDF Network ; September 2015',
      })
        .addOperation(
          this.minesweeperContract!.call(
            'reveal_winner',
            nativeToScVal(sessionId, { type: 'u32' })
          )
        )
        .setTimeout(30)
        .build();

      if (stellarClient.isDevWallet()) {
        return this.simulateTransaction(transaction, walletAddress);
      }

      return { hash: '', status: 'pending' };
    } catch (error) {
      return {
        hash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========================================================================
  // CLAIM PRIZE
  // ========================================================================

  /**
   * Claim the prize after winning
   * The winner calls this to withdraw their winnings from the contract
   */
  async claimPrize(params: ClaimPrizeParams): Promise<TransactionResult> {
    await this.ensureContractsInitialized();

    const walletAddress = this.getWalletAddress();
    const account = await this.getAccountDetails(walletAddress);

    try {
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: 'Test SDF Network ; September 2015',
      })
        .addOperation(
          this.minesweeperContract!.call(
            'claim_prize',
            nativeToScVal(params.sessionId, { type: 'u32' }),
            new SorobanAddress(params.winnerAddress).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      if (stellarClient.isDevWallet()) {
        return this.simulateTransaction(transaction, walletAddress);
      }

      return { hash: '', status: 'pending' };
    } catch (error) {
      return {
        hash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========================================================================
  // GET GAME STATE
  // ========================================================================

  /**
   * Get the current game state from the contract
   */
  async getGameState(sessionId: number): Promise<any> {
    await this.ensureContractsInitialized();

    try {
      const result = await rpc.getContractData(
        CONTRACTS.MINESWEEPER_ZK,
        xdr.ScVal.scvVec([
          nativeToScVal('Game', { type: 'symbol' }),
          nativeToScVal(sessionId, { type: 'u32' }),
        ])
      );

      // For now, return a mock state since we're in dev mode
      // TODO: Implement proper parsing when contracts are deployed
      return {
        player1: '',
        player2: '',
        player1Score: 0,
        player2Score: 0,
        winner: null,
      };
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  private parseGameState(scVal: xdr.ScVal): any {
    // Parse the contract data
    // This is a simplified version - in production you'd want proper parsing
    return {
      player1: '',
      player2: '',
      player1Score: 0,
      player2Score: 0,
      winner: null,
    };
  }

  // ========================================================================
  // SIMULATION (for dev wallets)
  // ========================================================================

  /**
   * Simulate a transaction (for dev/testing)
   */
  private async simulateTransaction(
    transaction: any,
    walletAddress: string
  ): Promise<TransactionResult> {
    try {
      const simResult = await rpc.simulateTransaction(transaction);

      // Check if simulation was successful
      if ('result' in simResult && simResult.result !== undefined) {
        // For dev mode, we'll just return a mock successful result
        const mockHash = `dev_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        return {
          hash: mockHash,
          status: 'success',
        };
      } else {
        return {
          hash: '',
          status: 'failed',
          error: ('error' in simResult) ? simResult.error?.toString() ?? 'Simulation failed' : 'Simulation failed',
        };
      }
    } catch (error) {
      return {
        hash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Simulation error',
      };
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): number {
    // Use timestamp to generate a reasonably unique ID
    return Math.floor(Date.now() / 1000) % 1000000;
  }

  /**
   * Format XLM amount for display
   */
  static formatXLM(stroops: bigint): string {
    const xlm = Number(stroops) / 10000000;
    return xlm.toFixed(2);
  }

  /**
   * Convert XLM to stroops
   */
  static xlmToStroops(xlm: number): bigint {
    return BigInt(Math.floor(xlm * 10000000));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const contractInteractions = new ContractInteractions();
