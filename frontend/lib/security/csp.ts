/**
 * Content Security Policy Configuration
 * Defines CSP headers for Next.js to prevent XSS and injection attacks
 */

/**
 * CSP configuration for Next.js
 * Add this to next.config.mjs in the headers function
 */
export const cspHeaders = [
  {
    key: 'Content-Security-Policy',
    value: getCSPValue(),
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: getPermissionsPolicy(),
  },
];

/**
 * Generate CSP header value
 * Customize based on your application's needs
 */
function getCSPValue(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // CSP directives
  const directives = [
    // Default to same origin for most content
    `default-src 'self'`,

    // Scripts: self, inline for development, and specific domains
    isDevelopment
      ? `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
      : `script-src 'self'`,

    // Styles: allow inline styles for Tailwind/CSS-in-JS
    `style-src 'self' 'unsafe-inline'`,

    // Images: self, data URLs, and Stellar/Freighter domains
    `img-src 'self' data: blob: https://*.stellar.org`,

    // Connect: Firebase, Stellar, and your API
    `connect-src 'self' ${
      isDevelopment ? 'ws://localhost:* wss://localhost:*' : 'wss://localhost:*'
    } https://*.firebaseio.com https://*.firebasedatabase.app https://*.stellar.org https://*.freighter.app`,

    // Fonts: self and data URLs
    `font-src 'self' data:`,

    // Objects: block all plugins
    `object-src 'none'`,

    // Base: restrict base URLs
    `base-uri 'self'`,

    // Form actions: restrict form submissions
    `form-action 'self'`,

    // Frame ancestors: prevent embedding
    `frame-ancestors 'none'`,

    // Manifest: only from self
    `manifest-src 'self'`,

    // Worker sources: restrict worker scripts
    `worker-src 'self' blob:`,

    // Upgrade insecure requests in production
    isDevelopment ? '' : `upgrade-insecure-requests`,
  ].filter(Boolean).join('; ');

  return directives;
}

/**
 * Generate Permissions-Policy header value
 * Restricts browser features and APIs
 */
function getPermissionsPolicy(): string {
  const permissions = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)', // Allow payment for Stellar wallet
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=(self)',
    'encrypted-media=()',
    'fullscreen=(self)',
    'picture-in-picture=(self)',
  ].join(', ');

  return permissions;
}

/**
 * Nonce generator for inline scripts (for production)
 * Use this if you need to allow specific inline scripts
 */
export function generateNonce(): string {
  if (typeof window === 'undefined') {
    // Server-side: use crypto
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  // Client-side: use Web Crypto API
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Get CSP meta tag for Next.js pages
 * Add this to your app/layout.tsx head
 */
export function getCSPMetaTag(): string {
  return `<meta http-equiv="Content-Security-Policy" content="${getCSPValue()}">`;
}

/**
 * CSP directive constants for type safety
 */
export const CSP_DIRECTIVES = {
  DEFAULT_SRC: 'default-src',
  SCRIPT_SRC: 'script-src',
  STYLE_SRC: 'style-src',
  IMG_SRC: 'img-src',
  CONNECT_SRC: 'connect-src',
  FONT_SRC: 'font-src',
  OBJECT_SRC: 'object-src',
  BASE_URI: 'base-uri',
  FORM_ACTION: 'form-action',
  FRAME_ANCESTORS: 'frame-ancestors',
  MANIFEST_SRC: 'manifest-src',
  WORKER_SRC: 'worker-src',
} as const;

/**
 * CSP source constants for type safety
 */
export const CSP_SOURCES = {
  SELF: "'self'",
  NONE: "'none'",
  UNSAFE_INLINE: "'unsafe-inline'",
  UNSAFE_EVAL: "'unsafe-eval'",
  DATA: 'data:',
  BLOB: 'blob:',
  ANY: '*',
} as const;

/**
 * Domain whitelist for Firebase and Stellar
 * Add your specific Firebase project domains here
 */
export const ALLOWED_DOMAINS = {
  firebase: [
    '*.firebaseio.com',
    '*.firebasedatabase.app',
    '*.firebaseapp.com',
    '*.cloudfunctions.net',
  ],
  stellar: [
    '*.stellar.org',
    '*.freighter.app',
    'laboratory.stellar.org', // For testing
  ],
  development: [
    'localhost:*',
    '127.0.0.1:*',
    '[::1]:*',
  ],
} as const;

/**
 * Validate URL against CSP whitelist
 */
export function isUrlAllowed(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Check if hostname matches any allowed domain
    const allAllowedDomains = [
      ...ALLOWED_DOMAINS.firebase,
      ...ALLOWED_DOMAINS.stellar,
      ...(process.env.NODE_ENV === 'development' ? ALLOWED_DOMAINS.development : []),
    ];

    return allAllowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        // Wildcard subdomain
        const baseDomain = domain.slice(2);
        return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
      }
      return hostname === domain;
    });
  } catch {
    return false;
  }
}

/**
 * Create CSP nonce attribute for Next.js
 */
export function getNonceAttribute(nonce: string): string {
  return `nonce="${nonce}"`;
}
