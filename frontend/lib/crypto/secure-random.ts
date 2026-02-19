/**
 * Secure Random Utility
 * Provides cryptographically secure random number generation
 *
 * IMPORTANT: Use these functions instead of Math.random() for:
 * - Seed generation for games
 * - Room codes
 * - Salt values
 * - Any security-sensitive random values
 *
 * Math.random() is NOT cryptographically secure and can be predicted,
 * which could allow attackers to manipulate game outcomes or guess room codes.
 */

// ============================================================================
// SECURE RANDOM STRING GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure random string
 *
 * Uses crypto.getRandomValues() which provides cryptographically strong
 * random values. This is suitable for:
 * - Game seeds (prevents manipulation)
 * - Session tokens
 * - Salt values
 * - Nonces
 *
 * @param length - Desired length of the output string
 * @returns A secure random string encoded in base36
 *
 * @example
 * const seed = generateSecureRandomString(12); // "a8k3m9x2p4q7"
 */
export function generateSecureRandomString(length: number): string {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js crypto (should not happen in 'use client' files)
    throw new Error('Secure random can only be generated on client side');
  }

  // We need more bytes than the final string length because base36 encoding
  // is less efficient. Each byte becomes 2 hex chars (0-255 -> 00-ff).
  // For base36, we need approximately length * 5.5 bytes.
  const byteLength = Math.ceil(length * 5.5);
  const randomBytes = new Uint8Array(byteLength);

  // Generate cryptographically secure random values
  crypto.getRandomValues(randomBytes);

  // Convert to base36 string (0-9, a-z)
  let result = '';
  for (let i = 0; i < randomBytes.length && result.length < length; i++) {
    // Convert each byte to base36 and append
    const value = randomBytes[i];
    const base36 = value.toString(36);
    result += base36;
  }

  // Trim to exact length
  return result.substring(0, length);
}

/**
 * Generate a secure random seed for game initialization
 *
 * Seeds should be unpredictable to prevent players from manipulating
 * game outcomes by predicting minefield layouts.
 *
 * @returns A 12-character secure random seed
 *
 * @example
 * const gameSeed = generateSecureSeed(); // "k3m9x2p7q4a8"
 */
export function generateSecureSeed(): string {
  return generateSecureRandomString(12);
}

/**
 * Generate a secure random salt for cryptographic hashing
 *
 * Salts prevent rainbow table attacks and ensure that identical inputs
 * produce different hash outputs.
 *
 * @returns A 12-character secure random salt
 *
 * @example
 * const salt = generateSecureSalt(); // "x9k2m5p8q3a7"
 */
export function generateSecureSalt(): string {
  return generateSecureRandomString(12);
}

/**
 * Generate a secure room code for multiplayer
 *
 * Room codes should be unpredictable to prevent attackers from guessing
 * valid room codes and joining private games.
 *
 * This generates a 4-character alphanumeric code in uppercase for
 * easy readability and sharing.
 *
 * @returns A 4-character uppercase room code
 *
 * @example
 * const roomCode = generateSecureRoomCode(); // "K3M9"
 */
export function generateSecureRoomCode(): string {
  // Generate 4 characters using only uppercase letters and digits
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);

  let result = '';
  for (let i = 0; i < 4; i++) {
    // Use modulo to map random byte to character index
    const index = randomBytes[i] % chars.length;
    result += chars[index];
  }

  return result;
}

/**
 * Generate a cryptographically unique ID
 *
 * Uses the Web Crypto API's randomUUID() method which generates
 * a RFC 4122 version 4 UUID. This is suitable for:
 * - Unique identifiers
 * - Request IDs
 * - Entity IDs
 *
 * @returns A UUID v4 string
 *
 * @example
 * const id = generateUUID(); // "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateUUID(): string {
  if (typeof window === 'undefined') {
    throw new Error('UUID generation can only happen on client side');
  }
  return crypto.randomUUID();
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * @deprecated Use generateSecureSeed() instead
 * This function is kept for migration reference only
 */
export function INSECURE_generateSeed_MathRandom(): string {
  // DO NOT USE - This is the old insecure method
  return Math.random().toString(36).substring(2, 15);
}

/**
 * @deprecated Use generateSecureRoomCode() instead
 * This function is kept for migration reference only
 */
export function INSECURE_generateRoomCode_MathRandom(): string {
  // DO NOT USE - This is the old insecure method
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}
