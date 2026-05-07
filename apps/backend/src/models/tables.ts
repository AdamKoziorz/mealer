import type { ColumnType, Generated } from 'kysely';
import type { GeometryPoint } from './types.js';

export interface UsersTable {
  user_id: Generated<string>;
  email: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OAuthAccountTable {
  oauth_account_id: Generated<string>;
  user_id: string;
  provider: string;
  provider_user_id: string;
  email: string;
  created_at: Generated<Date>;
}

export interface UserRestaurantsTable {
  user_restaurant_id: Generated<string>;
  user_id: string;
  name: string;
  address: string | null;
  location: ColumnType<
    GeometryPoint, // Select Type
    GeometryPoint | null, // Insert Type
    GeometryPoint | null // Delete Type
  >;
  rating: number | null;
  price_range: number | null;
  descriptors: string[] | null;
  menu_items: string[] | null;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface SessionTable {
  session_row_id: Generated<string>;
  session_token_hash: string;
  user_id: string;
  created_at: Generated<Date>;
  last_used_at: Generated<Date>;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface PendingOAuthTable {
  state: string;
  code_verifier: string;
  expires_at: Date;
}
