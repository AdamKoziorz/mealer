import { db } from "../../models/database.js";
import type { NewOAuthAccount, NewUser } from "../../models/types.js";

import { randomBase64Url, sha256Hex } from "./auth.utils.js"
import { env } from "../../config/env.js";

export class AuthRepository {
    async createUser(user_input: NewUser, provider_input: Omit<NewOAuthAccount, 'user_id'>) {

        // Transaction will create user in both the users table and oauth
        // accounts table, ensuring concurrency control
        return db.transaction().execute(async (trx) => {
            const newUser = await trx
            .insertInto('users')
            .values(user_input)
            .returningAll()
            .executeTakeFirstOrThrow();

            await trx
            .insertInto('oauth_accounts')
            .values({ user_id: newUser.user_id, ...provider_input})
            .execute();

            return { user_id: newUser.user_id };
        });
    }

    async findByProvider(provider: string, providerUserId: string) {
        return db
        .selectFrom("oauth_accounts")
        .selectAll()
        .where("provider", "=", provider)
        .where("provider_user_id", "=", providerUserId)
        .executeTakeFirst();
    }
};

export class SessionRepository {
  async createSession(userId: string) {

    const sessionToken = randomBase64Url(32);
    const sessionTokenHash = sha256Hex(sessionToken);

    await db
      .insertInto("sessions")
      .values({
        user_id: userId,
        session_token_hash: sessionTokenHash,
        created_at: new Date(),
        last_used_at: new Date(),
        expires_at: new Date(Date.now() + env.sessionTtlMs),
        revoked_at: null
      })
      .executeTakeFirstOrThrow();

    return { sessionToken };
  }

  async findValidSession(sessionToken: string) {
    const sessionTokenHash = sha256Hex(sessionToken);

    return db
      .selectFrom("sessions")
      .selectAll()
      .where("session_token_hash", "=", sessionTokenHash)
      .where("expires_at", ">", new Date())
      .where("revoked_at", "is", null)
      .executeTakeFirst();
  }

  async revokeSession(sessionToken: string) {
    const sessionTokenHash = sha256Hex(sessionToken);

    await db
      .updateTable("sessions")
      .set({ revoked_at: new Date() })
      .where("session_token_hash", "=", sessionTokenHash)
      .where("revoked_at", "is", null)
      .executeTakeFirst();
  }

  async deleteSession(sessionToken: string) {
    await this.revokeSession(sessionToken);
  }

  async touchSession(sessionToken: string) {
    const sessionTokenHash = sha256Hex(sessionToken);

    await db
      .updateTable("sessions")
      .set({ last_used_at: new Date() })
      .where("session_token_hash", "=", sessionTokenHash)
      .where("revoked_at", "is", null)
      .executeTakeFirst();
  }
};

export class PendingOAuthRepository {
  async storePendingAuth(stateHash: string, codeVerifier: string, expiresAt: Date): Promise<void> {
    await db
      .insertInto('pending_oauth')
      .values({ state: stateHash, code_verifier: codeVerifier, expires_at: expiresAt })
      .execute();
  }

  async consumePendingAuth(stateHash: string): Promise<string | undefined> {
    const row = await db
      .deleteFrom('pending_oauth')
      .where('state', '=', stateHash)
      .where('expires_at', '>', new Date())
      .returning('code_verifier')
      .executeTakeFirst();

    return row?.code_verifier;
  }
}
