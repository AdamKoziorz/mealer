import { OAuth2Client } from "google-auth-library";
import { UUID } from "crypto";
import crypto from "crypto";
import { AuthRepository, SessionRepository } from "./auth.repository";
import { NewOAuthAccount, NewUser } from "@/models/types";


export interface AuthenticatedUser {
  user_id: UUID;
}

const EXPRESS_PORT = process.env.EXPRESS_PORT || 6789;
const WEBSITE_URL = process.env.WEBSITE_URL

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `http://${WEBSITE_URL}:${EXPRESS_PORT}/auth/google/callback`
);


export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private sessionRepo: SessionRepository
  ) {}

  // We use a state parameter to protect against CSRF attacks
  private pendingStates = new Map<string, { timestamp: number }>();

  getGoogleAuthUrl(): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.pendingStates.set(state, { timestamp: Date.now() });
    
    // Use client's generateAuthUrl method
    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state: state,
    });
  }

  async handleGoogleCallback(code: string, state:string): Promise<{ user: AuthenticatedUser; session_id: UUID }> {
    
    // Verify state exists and is recent (within 10 minutes)
    const storedState = this.pendingStates.get(state);
    if (!storedState) {
      throw new Error("Invalid or expired state parameter");
    }
    
    const age = Date.now() - storedState.timestamp;
    if (age > 10 * 60 * 1000) {
      this.pendingStates.delete(state);
      throw new Error("State parameter expired");
    }
    
    // Remove used state
    this.pendingStates.delete(state);
    
    // Clean up old states (older than 10 minutes)
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of this.pendingStates.entries()) {
      if (value.timestamp < cutoff) {
        this.pendingStates.delete(key);
      }
    }
    
    
    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      throw new Error("No ID token returned");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      throw new Error("Invalid Google payload");
    }

    const user = await this.findOrCreateUserFromGoogle(payload);
    
    const session = await this.sessionRepo.createSession({
      user_id: user.user_id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    });

    return { user, session_id: session.session_id };
  }


  private async findOrCreateUserFromGoogle(payload: any): Promise<AuthenticatedUser> {
    const existingOAuth = await this.authRepo.findByProvider('google', payload.sub);
    
    if (existingOAuth) {
      return { user_id: existingOAuth.user_id };
    }

    let new_user: NewUser = {
      email: payload.email,
    }

    let new_oauth_user: Omit<NewOAuthAccount, 'user_id'> = {
      provider: 'google',
      provider_user_id: payload.sub,
      email: payload.email,
    }
      
    return await this.authRepo.createUser(new_user, new_oauth_user)
  }

  async logout(sessionId: UUID): Promise<void> {
    await this.sessionRepo.deleteSession(sessionId);
    // Add any other logout logic here (e.g., logging, analytics)
  }
}
