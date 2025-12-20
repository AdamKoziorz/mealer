import dotenv from "dotenv";
dotenv.config();

// Here is where we will define our database schema so that
// the backend can execute SQL commands on our database


import type { UUID } from "crypto";
import { Pool } from "pg";
import { Generated, Insertable, Kysely, PostgresDialect, Selectable, Updateable } from "kysely";

export interface UsersTable {
  user_id: Generated<UUID>                  
  email: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface UserRestaurantsTable {
  user_restaurant_id: Generated<UUID>
  user_id: UUID
  name: string
  address: string | null
  location: unknown       // ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::GEOGRAPHY
  rating: number | null
  price_range: number | null
  descriptors: string[] | null
  menu_items: string[] | null
  notes: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface Database {
  users: UsersTable
  user_restaurants: UserRestaurantsTable
}

export type User = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>
export type UserUpdate = Updateable<UsersTable>


// Set up Dialect
const dialect = new PostgresDialect({
    pool: new Pool({  // ?
        database: process.env.POSTGRES_DB,
        host: 'localhost',
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        port: 5432,
    })
})


// Finally, set up and export database
export const db = new Kysely<Database>({
  dialect
})

