import { Pool, type PoolConfig } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

import type {
  UserRestaurantsTable,
  UsersTable,
  OAuthAccountTable,
  SessionTable,
  PendingOAuthTable,
} from './tables.js';

export interface Database {
  users: UsersTable;
  user_restaurants: UserRestaurantsTable;
  oauth_accounts: OAuthAccountTable;
  sessions: SessionTable;
  pending_oauth: PendingOAuthTable;
}

function postgresSsl(): PoolConfig['ssl'] {
  const mode = process.env.POSTGRES_SSL_MODE ?? 'disable';

  if (mode === 'disable') return false;
  if (mode === 'require') return { rejectUnauthorized: false };
  if (mode === 'verify-full') {
    return {
      rejectUnauthorized: true,
      ca: process.env.POSTGRES_CA_CERT?.replace(/\\n/g, '\n'),
    };
  }

  throw new Error(`Invalid POSTGRES_SSL_MODE: ${mode}`);
}

const dialect = new PostgresDialect({
  pool: new Pool({
    database: process.env.POSTGRES_DB,
    // Prefer IPv4 loopback locally because Windows often resolves
    // "localhost" to ::1 first, while Postgres is only listening on 127.0.0.1.
    host: process.env.POSTGRES_HOST ?? '127.0.0.1',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
    ssl: postgresSsl(),
  }),
});

// This is the actual database that we can then use
export const db = new Kysely<Database>({
  dialect,
});
