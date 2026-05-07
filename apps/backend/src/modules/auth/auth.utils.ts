import crypto from 'node:crypto';

// Generate a random value for OAuth state
export function randomHex(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// Generates session tokens and PKCE code verifiers
export function randomBase64Url(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

// Hash OAuth state before putting in database
export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Derive PKCE code challenge from PKCE code verifier
export function sha256Base64Url(value: string): string {
  return crypto.createHash('sha256').update(value).digest('base64url');
}

// Safe comparison functions for secrets
export function secureEqual(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const buffer_a = Buffer.from(a);
  const buffer_b = Buffer.from(b);
  if (buffer_a.length !== buffer_b.length) return false;
  return crypto.timingSafeEqual(buffer_a, buffer_b);
}
