import { UUID } from "crypto"
import { ColumnType, Generated } from "kysely"
import { GeometryPoint } from "./types"

export interface UsersTable {
  user_id:              Generated<UUID>                  
  email:                string
  created_at:           Generated<Date>
  updated_at:           Generated<Date>
}

export interface OAuthAccountTable {
  oauth_account_id:     Generated<UUID>,
    user_id: 		    UUID,
    provider:           string,
    provider_user_id:   string,
    email:              string,
    created_at:         Generated<Date>
}

export interface UserRestaurantsTable {
  user_restaurant_id:   Generated<UUID>
  user_id:              UUID
  name:                 string
  address:              string | null
  location:             ColumnType<
                            GeometryPoint,         // Select Type
                            GeometryPoint | null,  // Insert Type
                            GeometryPoint | null   // Delete Type
                        >
  rating:               number | null
  price_range:          number | null
  descriptors:          string[] | null
  menu_items:           string[] | null
  notes:                string | null
  created_at:           Generated<Date>
  updated_at:           Generated<Date>
}

export interface SessionTable {
  session_id:           Generated<UUID>
  user_id:              UUID
  created_at:           Generated<Date>
  expires_at:           Date
}
