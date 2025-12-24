import { db } from "@/models/database";
import { NewOAuthAccount, NewSession, NewUser } from "@/models/types";
import { UUID } from "crypto";

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
  async createSession(input: NewSession) {
    return db
      .insertInto("sessions")
      .values(input)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findValidSession(sessionId: UUID) {
    return db
      .selectFrom("sessions")
      .selectAll()
      .where("session_id", "=", sessionId)
      .where("expires_at", ">", new Date())
      .executeTakeFirst();
  }

  async deleteSession(session_id: UUID) {
    return db
      .deleteFrom('sessions')
      .where('session_id', '=', session_id)
      .execute();
  }
};
