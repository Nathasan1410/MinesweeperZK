/**
 * Input Validation Utilities
 * Validates and sanitizes all user inputs to prevent security vulnerabilities
 */

import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Room code validation schema
 * - Must be exactly 4 characters
 * - Only alphanumeric characters (A-Z, 0-9)
 * - Case insensitive (will be normalized to uppercase)
 */
export const RoomCodeSchema = z.string()
  .length(4, 'Room code must be exactly 4 characters')
  .regex(/^[A-Z0-9]+$/i, 'Room code must contain only letters and numbers')
  .transform(val => val.toUpperCase())
  .refine(val => /^[A-Z0-9]{4}$/.test(val), {
    message: 'Invalid room code format'
  });

/**
 * Stellar address validation schema
 * - Must be exactly 56 characters
 * - Must start with 'G'
 * - Must be base32 encoded (ED25519 public key)
 */
export const StellarAddressSchema = z.string()
  .length(56, 'Stellar address must be exactly 56 characters')
  .startsWith('G', 'Stellar address must start with G')
  .regex(/^[G][A-Z2-7]{55}$/, 'Invalid Stellar address format');

/**
 * Room name validation schema
 * - Must be 1-50 characters
 * - No HTML tags or special characters
 * - Trim whitespace
 */
export const RoomNameSchema = z.string()
  .min(1, 'Room name is required')
  .max(50, 'Room name must be less than 50 characters')
  .transform(val => val.trim())
  .refine(val => !/<[^>]*>/.test(val), {
    message: 'Room name cannot contain HTML tags'
  })
  .refine(val => !/[\x00-\x1F\x7F]/.test(val), {
    message: 'Room name contains invalid characters'
  });

/**
 * Bet amount validation schema
 * - Must be positive number
 * - Maximum bet: 1000 XLM
 * - Minimum bet: 1 XLM
 */
export const BetAmountSchema = z.number()
  .min(1, 'Bet amount must be at least 1 XLM')
  .max(1000, 'Bet amount cannot exceed 1000 XLM')
  .int('Bet amount must be a whole number');

/**
 * Player name validation schema (for display purposes)
 * - Must be 1-20 characters
 * - Alphanumeric and spaces only
 */
export const PlayerNameSchema = z.string()
  .min(1, 'Player name is required')
  .max(20, 'Player name must be less than 20 characters')
  .regex(/^[a-zA-Z0-9\s]+$/, 'Player name can only contain letters, numbers, and spaces');

/**
 * Seed string validation for commitment scheme
 * - Must be at least 16 characters
 * - Only alphanumeric and basic symbols
 */
export const SeedStringSchema = z.string()
  .min(16, 'Seed must be at least 16 characters')
  .max(256, 'Seed cannot exceed 256 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Seed contains invalid characters');

/**
 * Firebase room ID validation
 * - Must be non-empty string
 * - alphanumeric with dashes and underscores
 */
export const RoomIdSchema = z.string()
  .min(1, 'Room ID is required')
  .max(128, 'Room ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid room ID format');

/**
 * Contract session ID validation
 * - Must be positive integer
 * - Less than max safe integer
 */
export const SessionIdSchema = z.number()
  .int('Session ID must be an integer')
  .positive('Session ID must be positive')
  .max(Number.MAX_SAFE_INTEGER, 'Session ID too large');

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate and sanitize room code
 */
export function validateRoomCode(code: unknown): string {
  try {
    return RoomCodeSchema.parse(code);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid room code: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Validate Stellar address
 */
export function validateStellarAddress(address: unknown): string {
  try {
    return StellarAddressSchema.parse(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid Stellar address: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Validate room name
 */
export function validateRoomName(name: unknown): string {
  try {
    return RoomNameSchema.parse(name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid room name: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Validate bet amount
 */
export function validateBetAmount(amount: unknown): number {
  try {
    return BetAmountSchema.parse(amount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid bet amount: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Validate player name
 */
export function validatePlayerName(name: unknown): string {
  try {
    return PlayerNameSchema.parse(name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid player name: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Validate seed string
 */
export function validateSeedString(seed: unknown): string {
  try {
    return SeedStringSchema.parse(seed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid seed: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Validate room ID
 */
export function validateRoomId(roomId: unknown): string {
  try {
    return RoomIdSchema.parse(roomId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid room ID: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Validate session ID
 */
export function validateSessionId(sessionId: unknown): number {
  try {
    return SessionIdSchema.parse(sessionId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid session ID: ${error.errors[0].message}`);
    }
    throw error;
  }
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize string for display (prevent XSS)
 * - Escapes HTML characters
 * - Removes potentially dangerous content
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize room code for display
 */
export function sanitizeRoomCode(code: string): string {
  const sanitized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(sanitized)) {
    throw new Error('Invalid room code format');
  }
  return sanitized;
}

/**
 * Truncate address for display (e.g., "GABC...XYZ")
 */
export function truncateAddress(address: string, startLength: number = 8, endLength: number = 4): string {
  if (typeof address !== 'string' || address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Validate and sanitize create room parameters
 */
export function validateCreateRoomParams(params: {
  name: unknown;
  creator: unknown;
  creatorAddress: unknown;
  betAmount?: unknown;
  isPublic?: unknown;
}): {
  name: string;
  creator: string;
  creatorAddress: string;
  betAmount: number;
  isPublic: boolean;
} {
  const name = validateRoomName(params.name);
  const creator = validatePlayerName(params.creator);
  const creatorAddress = validateStellarAddress(params.creatorAddress);
  const betAmount = params.betAmount !== undefined ? validateBetAmount(params.betAmount) : 10;
  const isPublic = params.isPublic === true;

  return { name, creator, creatorAddress, betAmount, isPublic };
}

/**
 * Validate and sanitize join room parameters
 */
export function validateJoinRoomParams(params: {
  roomId: unknown;
  playerAddress: unknown;
}): {
  roomId: string;
  playerAddress: string;
} {
  const roomId = validateRoomId(params.roomId);
  const playerAddress = validateStellarAddress(params.playerAddress);

  return { roomId, playerAddress };
}

/**
 * Check if string contains potentially malicious content
 */
export function isMaliciousContent(input: string): boolean {
  // Check for common XSS patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<style/i,
    /expression\s*\(/i, // CSS expression
    /@import/i,
  ];

  return maliciousPatterns.some(pattern => pattern.test(input));
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Safe validation wrapper that returns Result type
 */
export function safeValidate<T>(
  validator: (input: unknown) => T,
  input: unknown
): ValidationResult<T> {
  try {
    const data = validator(input);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}
