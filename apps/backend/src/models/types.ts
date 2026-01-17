import { Insertable, Selectable, Updateable } from "kysely"
import { OAuthAccountTable, SessionTable, UserRestaurantsTable, UsersTable } from "./tables"

// Below contains general types that are used in the backend

import { UUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: UUID;
      };
    }
  }
}

export type GeometryPoint = {
  __type: 'geometry(Point,4326)'
}

// Below contains types which abstract the input data needed for kysely to
// perform each relevant CRUD query

export type User = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>

export type OAuthAccount = Selectable<OAuthAccountTable>
export type NewOAuthAccount = Insertable<OAuthAccountTable>

export type Session = Selectable<SessionTable>
export type NewSession = Insertable<SessionTable>


export type Restaurant = Omit<Selectable<UserRestaurantsTable>, 'location'> & {
  latitude?: number
  longitude?: number
}
export type NewRestaurant = Omit<Insertable<UserRestaurantsTable>, 'location'> & {
  latitude?: number
  longitude?: number
}
export type ChangeRestaurant = Omit<Updateable<UserRestaurantsTable>, 'location'> & {
  latitude?: number
  longitude?: number
}