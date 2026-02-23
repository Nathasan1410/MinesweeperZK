/**
 * Security Module
 * Central export point for all security utilities
 *
 * Usage:
 * import { validateRoomCode, generateSecureRoomCode } from '@/lib/security';
 */

// ============================================================================
// VALIDATORS
// ============================================================================

export {
  // Schemas
  RoomCodeSchema,
  StellarAddressSchema,
  RoomNameSchema,
  BetAmountSchema,
  PlayerNameSchema,
  SeedStringSchema,
  RoomIdSchema,
  SessionIdSchema,

  // Validation functions
  validateRoomCode,
  validateStellarAddress,
  validateRoomName,
  validateBetAmount,
  validatePlayerName,
  validateSeedString,
  validateRoomId,
  validateSessionId,

  // Sanitization
  sanitizeString,
  sanitizeRoomCode,
  truncateAddress,
  validateCreateRoomParams,
  validateJoinRoomParams,
  isMaliciousContent,

  // Types
  type ValidationResult,
  safeValidate,
} from './validator';

// ============================================================================
// SECURE RANDOM
// ============================================================================

export {
  // Random generation
  secureRandomBytes,
  secureRandomHex,
  secureRandomBase64,
  secureRandomInt,
  generateSecureRoomCode,
  generateSecureSeed,
  generateCommitString,
  generateSecureSessionId,
  combineSeeds,

  // Cryptography
  sha256,
  verifyCommit,
  generateNonce,
  generateUUID,

  // Rate limiting
  RateLimiter,
  rateLimiters,

  // Utilities
  isSecureContext,
  warnInsecureContext,
  validateRandomness,
} from './random';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

export {
  env,
  validateEnv,
  isEnvValid,
  getMaskedEnv,
  logEnvConfig,
  validateNoHardcodedSecrets,
  type Env,
} from './env';

// ============================================================================
// CSP (Content Security Policy)
// ============================================================================

export {
  cspHeaders,
  getCSPValue,
  getCSPMetaTag,
  generateNonce as generateCSPNonce,
  getNonceAttribute,
  isUrlAllowed,
  CSP_DIRECTIVES,
  CSP_SOURCES,
  ALLOWED_DOMAINS,
} from './csp';

// ============================================================================
// RE-EXPORT COMMON TYPES
// ============================================================================

export type {
  ValidationResult,
} from './validator';
