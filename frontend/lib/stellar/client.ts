/**
 * Stellar Wallet Client
 * Handles wallet connections and interactions for the Minesweeper ZK game
 */

import * as FreighterApi from '@stellar/freighter-api';

// Contract addresses (Testnet)
export const CONTRACTS = {
  GAME_HUB: process.env.NEXT_PUBLIC_GAME_HUB_CONTRACT!,
  MINESWEEPER_ZK: process.env.NEXT_PUBLIC_MINESWEEPER_CONTRACT!,
} as const;

// Dev wallet addresses (from setup)
export const DEV_WALLETS = {
  ADMIN: 'GAWK4FEEYQ3RHINSSBBUGX6T6K7DED5TYZPO4K3QN6LZ7DRKOU6THKJT',
  PLAYER1: 'GDOU6C4NXN37MKRR75Z75B4DA4LN2EK3TYOD7GODPY2WN2VB44KJV4CC',
  PLAYER2: 'GAMHAOUJG474HELCKG4MXCULGKY7PUMJWWCS3CXYFW6NZUI27EAGUWIJ',
} as const;

export type DevWallet = keyof typeof DEV_WALLETS;

export interface StellarAccount {
  address: string;
  isConnected: boolean;
  isDev: boolean;
}

export interface GameStartParams {
  player1: string;
  player2: string;
  betAmount: bigint;
}

export interface GameEndParams {
  sessionId: number;
  player1Won: boolean;
}

class StellarClient {
  private currentAccount: StellarAccount | null = null;
  private currentDevWallet: DevWallet | null = null;

  /**
   * Connect a real wallet via Freighter
   */
  async connectWallet(): Promise<StellarAccount | null> {
    try {
      // Bypass `isConnected()` since it often hangs browsers indefinitely if the wallet is locked.
      // Force the connection with a 5-second timeout so it never spins infinitely.
      const accessResponse: any = await Promise.race([
        FreighterApi.requestAccess(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Freighter wallet taking too long to respond. Please unlock it manually!')), 5000))
      ]);

      if (accessResponse && accessResponse.error) {
        console.error('Freighter access denied:', accessResponse.error);
        alert(`Freighter Error: ${accessResponse.error}`);
        return null;
      }

      // Then get the address
      const result = await FreighterApi.getAddress();
      if (result && result.address) {
        this.currentAccount = {
          address: result.address,
          isConnected: true,
          isDev: false,
        };
        this.currentDevWallet = null;
        return this.currentAccount;
      } else {
        alert("Failed to get Freighter address.");
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      alert(`Wallet Connection Failed: ${error.message || 'Make sure Freighter is installed and unlocked!'}`);
    }
    return null;
  }

  /**
   * Switch to dev wallet (for testing)
   */
  switchDevWallet(wallet: DevWallet): StellarAccount {
    this.currentDevWallet = wallet;
    this.currentAccount = {
      address: DEV_WALLETS[wallet],
      isConnected: true,
      isDev: true,
    };
    return this.currentAccount;
  }

  /**
   * Get current connected account
   */
  getCurrentAccount(): StellarAccount | null {
    return this.currentAccount;
  }

  /**
   * Disconnect current wallet
   */
  disconnect(): void {
    this.currentAccount = null;
    this.currentDevWallet = null;
  }

  /**
   * Check if currently using dev wallet
   */
  isDevWallet(): boolean {
    return this.currentAccount?.isDev ?? false;
  }

  /**
   * Get current dev wallet name
   */
  getDevWalletName(): DevWallet | null {
    return this.currentDevWallet;
  }
}

// Singleton instance
export const stellarClient = new StellarClient();
