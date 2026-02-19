/**
 * Environment Variable Validation
 * Validates all required environment variables at startup using Zod
 */

import { z } from 'zod';

// ============================================================================
// ENV SCHEMA
// ============================================================================

/**
 * Environment variable schema
 * Add all required and optional environment variables here
 */
const EnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: z.string().url('Invalid Firebase database URL'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),

  // Stellar Configuration
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['testnet', 'mainnet', 'standalone']).default('testnet'),
  NEXT_PUBLIC_GAME_HUB_CONTRACT: z.string().min(1, 'Game Hub contract address is required'),
  NEXT_PUBLIC_MINESWEEPER_CONTRACT: z.string().min(1, 'Minesweeper contract address is required'),

  // Application Configuration
  NEXT_PUBLIC_MAX_BET_AMOUNT: z.string().transform(Number).pipe(z.number().positive()).default('1000'),
  NEXT_PUBLIC_MIN_BET_AMOUNT: z.string().transform(Number).pipe(z.number().positive()).default('1'),
  NEXT_PUBLIC_GAME_TIMEOUT_MINUTES: z.string().transform(Number).pipe(z.number().positive()).default('15'),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_DEV_WALLET: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
});

// ============================================================================
// VALIDATED ENV EXPORT
// ============================================================================

/**
 * Validated environment variables
 * Import this instead of process.env to ensure type safety and validation
 */
export const env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,

  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,

  // Stellar
  NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
  NEXT_PUBLIC_GAME_HUB_CONTRACT: process.env.NEXT_PUBLIC_GAME_HUB_CONTRACT,
  NEXT_PUBLIC_MINESWEEPER_CONTRACT: process.env.NEXT_PUBLIC_MINESWEEPER_CONTRACT,

  // Application
  NEXT_PUBLIC_MAX_BET_AMOUNT: process.env.NEXT_PUBLIC_MAX_BET_AMOUNT,
  NEXT_PUBLIC_MIN_BET_AMOUNT: process.env.NEXT_PUBLIC_MIN_BET_AMOUNT,
  NEXT_PUBLIC_GAME_TIMEOUT_MINUTES: process.env.NEXT_PUBLIC_GAME_TIMEOUT_MINUTES,

  // Feature flags
  NEXT_PUBLIC_ENABLE_DEV_WALLET: process.env.NEXT_PUBLIC_ENABLE_DEV_WALLET,
  NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Env = z.infer<typeof EnvSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate environment variables
 * Call this at application startup
 * @throws Error if validation fails
 */
export function validateEnv(): Env {
  try {
    return EnvSchema.parse({
      NODE_ENV: process.env.NODE_ENV,

      // Firebase
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,

      // Stellar
      NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
      NEXT_PUBLIC_GAME_HUB_CONTRACT: process.env.NEXT_PUBLIC_GAME_HUB_CONTRACT,
      NEXT_PUBLIC_MINESWEEPER_CONTRACT: process.env.NEXT_PUBLIC_MINESWEEPER_CONTRACT,

      // Application
      NEXT_PUBLIC_MAX_BET_AMOUNT: process.env.NEXT_PUBLIC_MAX_BET_AMOUNT,
      NEXT_PUBLIC_MIN_BET_AMOUNT: process.env.NEXT_PUBLIC_MIN_BET_AMOUNT,
      NEXT_PUBLIC_GAME_TIMEOUT_MINUTES: process.env.NEXT_PUBLIC_GAME_TIMEOUT_MINUTES,

      // Feature flags
      NEXT_PUBLIC_ENABLE_DEV_WALLET: process.env.NEXT_PUBLIC_ENABLE_DEV_WALLET,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `- ${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(
        `Environment variable validation failed:\n${missingVars}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      );
    }
    throw error;
  }
}

/**
 * Check if all required environment variables are set
 * Returns true if valid, false otherwise
 */
export function isEnvValid(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get masked environment for logging (hides secrets)
 */
export function getMaskedEnv(): Record<string, string> {
  return {
    NODE_ENV: env.NODE_ENV,
    NEXT_PUBLIC_FIREBASE_API_KEY: maskSecret(env.NEXT_PUBLIC_FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: maskUrl(env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_STELLAR_NETWORK: env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_GAME_HUB_CONTRACT: maskAddress(env.NEXT_PUBLIC_GAME_HUB_CONTRACT),
    NEXT_PUBLIC_MINESWEEPER_CONTRACT: maskAddress(env.NEXT_PUBLIC_MINESWEEPER_CONTRACT),
    NEXT_PUBLIC_MAX_BET_AMOUNT: env.NEXT_PUBLIC_MAX_BET_AMOUNT.toString(),
    NEXT_PUBLIC_MIN_BET_AMOUNT: env.NEXT_PUBLIC_MIN_BET_AMOUNT.toString(),
    NEXT_PUBLIC_GAME_TIMEOUT_MINUTES: env.NEXT_PUBLIC_GAME_TIMEOUT_MINUTES.toString(),
    NEXT_PUBLIC_ENABLE_DEV_WALLET: env.NEXT_PUBLIC_ENABLE_DEV_WALLET.toString(),
    NEXT_PUBLIC_ENABLE_ANALYTICS: env.NEXT_PUBLIC_ENABLE_ANALYTICS.toString(),
  };
}

/**
 * Mask secret for display
 */
function maskSecret(secret: string, visibleChars: number = 8): string {
  if (secret.length <= visibleChars) {
    return '*'.repeat(secret.length);
  }
  return `${secret.slice(0, visibleChars)}${'*'.repeat(secret.length - visibleChars)}`;
}

/**
 * Mask URL for display (hide query params and sensitive path parts)
 */
function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/***`;
  } catch {
    return maskSecret(url, 20);
  }
}

/**
 * Mask Stellar address for display
 */
function maskAddress(address: string): string {
  if (address.length <= 12) {
    return maskSecret(address);
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Log environment configuration (for debugging)
 * WARNING: Only use in development, never in production
 */
export function logEnvConfig(): void {
  if (env.NODE_ENV === 'production') {
    console.warn('Security Warning: Attempted to log env config in production');
    return;
  }

  console.log('Environment Configuration:', {
    ...getMaskedEnv(),
    _validation: 'PASSED',
  });
}

/**
 * Validate that we're not exposing sensitive data
 * Check for common mistakes like hardcoded secrets
 */
export function validateNoHardcodedSecrets(): boolean {
  const sensitivePatterns = [
    /sk_test_/, // Stripe test keys
    /sk_live_/, // Stripe live keys
    /AIza[A-Za-z0-9_-]{35}/, // Google API keys (Firebase)
    new RegExp("1/[A-Za-z0-9_-]{43}"), // Google OAuth keys
    /AKIA[A-Z0-9]{16}/, // AWS access keys
    /-----BEGIN [A-Z]+ PRIVATE KEY-----/, // Private keys
  ];

  // Check all env values for sensitive patterns
  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== 'string') continue;

    for (const pattern of sensitivePatterns) {
      if (pattern.test(value)) {
        console.error(`Security Warning: Potentially sensitive data in ${key}`);
        return false;
      }
    }
  }

  return true;
}
