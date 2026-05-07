import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import type { AuthRepository, PendingOAuthRepository, SessionRepository } from "./auth.repository.js";

import { env } from "../../config/env.js"

import {
  randomHex,
  randomBase64Url,
  sha256Base64Url,
  sha256Hex,
  secureEqual,
} from "./auth.utils.js"

export interface AuthenticatedUser {
  user_id: string;
}

const googleClient = new OAuth2Client(
  env.googleClientId,
  env.googleClientSecret,
  `${env.backendOrigin}/auth/google/callback`
);


export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private sessionRepo: SessionRepository,
    private pendingOAuthRepo: PendingOAuthRepository
  ) {}

  async createGoogleAuthRequest() {
    // RFC 6749 - Bind OAuth state to the initiating user agent.
    const state = randomHex(32);
    const stateHash = sha256Hex(state);

    // RFC 7636 - Code verifier must be high-entropy, and S256 should be
    // used for the challenge.
    const codeVerifier = randomBase64Url(32);
    const codeChallenge = sha256Base64Url(codeVerifier);

    const url = googleClient.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256
    })

    await this.pendingOAuthRepo.storePendingAuth(
      stateHash,
      codeVerifier,
      new Date(Date.now() + env.oAuthStateTtlMs)
    );

    return { url, state };
  }


  async handleGoogleCallback(params: {
    code?: string,
    receivedState?: string,
    expectedState?: string,
  }): Promise<{ user: AuthenticatedUser; sessionToken: string }> {

    const { code, receivedState, expectedState } = params;

    if (!code) throw new Error("Missing OAuth code");
    if (!receivedState || !expectedState) throw new Error("Missing OAuth state");
    if (!secureEqual(receivedState, expectedState)) throw new Error("Invalid OAuth state");

    // Atomically consume the pending auth record - also validates state and TTL.
    const codeVerifier = await this.pendingOAuthRepo.consumePendingAuth(sha256Hex(receivedState));
    if (!codeVerifier) throw new Error("Invalid or expired OAuth state");

    // RFC 7636 - Client sends auth code and code verifier to token endpoint.
    const { tokens } = await googleClient.getToken({
      code,
      codeVerifier,
      redirect_uri: `${env.backendOrigin}/auth/google/callback`
    });

    if (!tokens.id_token) throw new Error("No ID token returned");

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.googleClientId
    })

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error("Invalid Google identity payload");
    }

    const user = await this.findOrCreateUserFromGoogle(payload);
    const { sessionToken } = await this.sessionRepo.createSession(user.user_id);

    return { user, sessionToken };
  }



  private async findOrCreateUserFromGoogle(payload: any): Promise<AuthenticatedUser> {
    const existingOAuth = await this.authRepo.findByProvider('google', payload.sub);

    if (existingOAuth) {
      return { user_id: existingOAuth.user_id };
    }

    try {
      return await this.authRepo.createUser(
        { email: payload.email },
        { provider: 'google', provider_user_id: payload.sub, email: payload.email }
      );
    } catch {
      const retry = await this.authRepo.findByProvider('google', payload.sub);
      if (retry) return { user_id: retry.user_id };
      throw new Error('Failed to create user account')
    }
  }

  async logout(sessionToken: string): Promise<void> {
    await this.sessionRepo.deleteSession(sessionToken);
  }
}
