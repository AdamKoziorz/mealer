import { db } from "@/models/database"
import { ChangeRestaurant, NewRestaurant } from "@/models/types"
import { UUID } from "crypto"
import { sql } from "kysely"

export class RestaurantRepository {
  async findByUserId(userId: UUID) {
    return db
      .selectFrom('user_restaurants')
      .select([
        'user_restaurant_id',
        'user_id',
        'name',
        'address',
        'rating',
        'price_range',
        'descriptors',
        'menu_items',
        'notes',
        'created_at',
        'updated_at',
      sql<number>`ST_Y(location::geometry)`.as('latitude'),
      sql<number>`ST_X(location::geometry)`.as('longitude'),
    ])
      .where('user_id', '=', userId)
      .execute()
  }

  async findById(restaurantId: UUID, userId: UUID) {
    return db
      .selectFrom('user_restaurants')
      .select([
        'user_restaurant_id',
        'user_id',
        'name',
        'address',
        'rating',
        'price_range',
        'descriptors',
        'menu_items',
        'notes',
        'created_at',
        'updated_at',
        sql<number>`ST_Y(location::geometry)`.as('latitude'),
        sql<number>`ST_X(location::geometry)`.as('longitude'),
      ])
      .where('user_restaurant_id', '=', restaurantId)
      .where('user_id', '=', userId)
      .executeTakeFirst()
  }

  async create(data: NewRestaurant) {
    const { latitude, longitude, ...rest } = data

    console.log({
        ...rest,
        location: latitude && longitude
            ? sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::GEOGRAPHY`
            : null,
        })

    return db
        .insertInto('user_restaurants')
        .values({
        ...rest,
        location: latitude && longitude
            ? sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::GEOGRAPHY`
            : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow()
    }


  async update(restaurantId: UUID, userId: UUID, data: ChangeRestaurant) {
    const { latitude, longitude, ...rest } = data
    
    let updateData: any = { ...rest, updated_at: new Date() }

    return db
      .updateTable('user_restaurants')
      .set({
        ...updateData,
        location: latitude && longitude
            ? sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::GEOGRAPHY`
            : null,
        })
      .where('user_restaurant_id', '=', restaurantId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst()
  }


  async delete(restaurantId: UUID, userId: UUID) {
    return db
      .deleteFrom('user_restaurants')
      .where('user_restaurant_id', '=', restaurantId)
      .where('user_id', '=', userId)
      .executeTakeFirst()
  }
}
