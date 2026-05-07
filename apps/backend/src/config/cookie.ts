// Standardize cookie variables across the application
import { env } from './env.js';

export const cookie = {
  // Browser hardening
  sessionName: env.isProduction ? '__Host-session_id' : 'session_id',
  oAuthStateName: env.isProduction ? '__Host-oauth-state' : 'oauth_state',
  pkceName: env.isProduction ? '__Host-pkce_verifier' : 'pkce_verifier',

  // Security config
  secure: env.isProduction,
  sameSite: 'lax' as const,
  path: '/',
};
