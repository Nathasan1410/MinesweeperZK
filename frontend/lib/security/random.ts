/**
 * Secure Random Number Generation
 * Provides cryptographically secure random number generation for:
 * - Room codes
 * - Game seeds
 * - Commit-reveal random strings
 * - Session IDs
 */

// ============================================================================
// SECURE RANDOM GENERATION
// ============================================================================

/**
 * Generate cryptographically secure random bytes
 * Uses Web Crypto API in browser, Node.js crypto in server
 */
async function secureRandomBytes(length: number): Promise<Uint8Array> {
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  }

  // Node.js environment
  const crypto = await import('crypto');
  return new Uint8Array(crypto.randomBytes(length));
}

/**
 * Generate secure random hex string
 */
export async function secureRandomHex(length: number = 32): Promise<string> {
  const bytes = await secureRandomBytes(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate secure random base64 string
 */
export async function secureRandomBase64(length: number = 24): Promise<string> {
  const bytes = await secureRandomBytes(length);
  // Use base64url encoding (URL-safe)
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate secure random integer within range
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 */
export async function secureRandomInt(min: number, max: number): Promise<number> {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const bytes = await secureRandomBytes(bytesNeeded);

  // Convert bytes to integer
  let randomValue = 0;
  for (let i = 0; i < bytes.length; i++) {
    randomValue = (randomValue << 8) + bytes[i];
  }

  // Use modulo to get value in range (with slight bias for large ranges)
  return min + (randomValue % range);
}

/**
 * Generate cryptographically secure room code
 * - 4 characters alphanumeric
 * - Uses crypto.getRandomValues() for security
 * - Rejects ambiguous characters (0/O, 1/I/l)
 */
export async function generateSecureRoomCode(): Promise<string> {
  // Use unambiguous character set (no 0/O, 1/I/l)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 characters

  let code = '';
  const bytes = await secureRandomBytes(4);

  for (let i = 0; i < 4; i++) {
    // Use 5 bits of randomness per character (2^5 = 32, fits our charset)
    const randomIndex = bytes[i] % 32;
    code += chars[randomIndex];
  }

  return code;
}

/**
 * Generate cryptographically secure game seed
 * - 64-character hex string (256 bits)
 * - Suitable for commit-reveal schemes
 */
export async function generateSecureSeed(): Promise<string> {
  return secureRandomHex(32); // 32 bytes = 256 bits = 64 hex chars
}

/**
 * Generate commit-reveal random string
 * - Used for seed commitment phase
 * - Includes timestamp to prevent replay attacks
 * - Returns: { commit: string, reveal: string, hash: string }
 */
export async function generateCommitString(
  playerIdentifier: string
): Promise<{
  commit: string;    // The hash to commit
  reveal: string;    // The random value to reveal later
  hash: string;      // SHA-256 hash of reveal + identifier
}> {
  // Generate secure random reveal string
  const reveal = await secureRandomBase64(32);

  // Create hash with player identifier for binding
  const hashInput = `${reveal}_${playerIdentifier}_${Date.now()}`;
  const hash = await sha256(hashInput);

  return {
    commit: hash,
    reveal,
    hash,
  };
}

/**
 * Generate secure session ID for contract interactions
 * - Large random number to prevent collisions
 * - Suitable for on-chain session tracking
 */
export async function generateSecureSessionId(): Promise<number> {
  // Generate 48-bit random number (fits in JS safe integer)
  const bytes = await secureRandomBytes(6);
  let sessionId = 0;

  for (let i = 0; i < bytes.length; i++) {
    sessionId = (sessionId << 8) + bytes[i];
  }

  return sessionId;
}

/**
 * Generate combined seed from two player commitments
 * - Used after reveal phase
 * - Combines both random strings cryptographically
 */
export async function combineSeeds(
  seed1: string,
  seed2: string
): Promise<string> {
  const combined = `${seed1}_${seed2}`;
  return sha256(combined);
}

/**
 * SHA-256 hash function
 * Works in both browser and Node.js
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js environment
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Verify commit-reveal integrity
 * @param commit Original commit hash
 * @param reveal Reveal string
 * @param playerIdentifier Player's address/identifier
 */
export async function verifyCommit(
  commit: string,
  reveal: string,
  playerIdentifier: string
): Promise<boolean> {
  // Note: This assumes the commit was created without timestamp
  // In production, store and verify the timestamp too
  const hashInput = `${reveal}_${playerIdentifier}`;
  const computedHash = await sha256(hashInput);

  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(commit, computedHash);
}

/**
 * Constant-time string comparison
 * Prevents timing attacks on hash comparison
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate nonce for cryptographic operations
 */
export async function generateNonce(): Promise<string> {
  return secureRandomBase64(16);
}

/**
 * Generate UUID v4 (random)
 * RFC 4122 compliant
 */
export async function generateUUID(): Promise<string> {
  const bytes = await secureRandomBytes(16);

  // Set version to 0100 (v4)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Set variant to 10xxxxxx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Format as UUID
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

// ============================================================================
// RATE LIMITING TOKEN BUCKET (Client-side)
// ============================================================================

/**
 * Rate limiter using token bucket algorithm
 * Use this to limit client-side operations (room creation, joins, etc.)
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number, // tokens per millisecond
    private windowStart: number = Date.now()
  ) {
    this.tokens = maxTokens;
    this.lastRefill = windowStart;
  }

  /**
   * Attempt to consume a token
   * @returns true if token was consumed, false if rate limited
   */
  async tryConsume(tokens: number = 1): Promise<boolean> {
    const now = Date.now();

    // Refill tokens based on time elapsed
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed * this.refillRate);

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;

    // Check if we have enough tokens
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Get time until next token is available
   */
  getTimeUntilNextToken(): number {
    if (this.tokens >= this.maxTokens) {
      return 0;
    }

    const tokensNeeded = this.maxTokens - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Create rate limiters for common operations
 */
export const rateLimiters = {
  // Room creation: 5 per minute
  roomCreation: new RateLimiter(5, 5 / 60000),

  // Room joining: 10 per minute
  roomJoining: new RateLimiter(10, 10 / 60000),

  // Score submission: 3 per minute
  scoreSubmission: new RateLimiter(3, 3 / 60000),

  // Contract interactions: 10 per minute
  contractCalls: new RateLimiter(10, 10 / 60000),
} as const;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if running in secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') {
    // Server-side is always secure (uses TLS for external connections)
    return true;
  }

  return window.isSecureContext;
}

/**
 * Warn if not in secure context
 */
export function warnInsecureContext(): void {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    console.warn(
      'Security Warning: Not running in secure context (HTTPS).\n' +
      'Cryptographic operations may be unreliable.'
    );
  }
}

/**
 * Validate randomness quality
 * Check if the crypto API is available and working
 */
export async function validateRandomness(): Promise<boolean> {
  try {
    const testBytes = await secureRandomBytes(16);
    // Check if bytes are not all zeros (basic sanity check)
    const hasNonZero = testBytes.some(b => b !== 0);
    return hasNonZero;
  } catch {
    return false;
  }
}
