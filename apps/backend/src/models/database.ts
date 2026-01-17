import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

import { 
  UserRestaurantsTable,
  UsersTable,
  OAuthAccountTable,
  SessionTable
} from "./tables";

import dotenv from 'dotenv';

dotenv.config();

export interface Database {
  users: UsersTable
  user_restaurants: UserRestaurantsTable
  oauth_accounts: OAuthAccountTable
  sessions: SessionTable
}

const dialect = new PostgresDialect({
    pool: new Pool({  // ?
        database: process.env.POSTGRES_DB,
        host: 'localhost',
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        port: 5432,
    })
})

// This is the actual database that we can then use
export const db = new Kysely<Database>({
  dialect
})
