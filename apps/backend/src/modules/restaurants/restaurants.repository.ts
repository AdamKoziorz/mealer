import { db } from '../../models/database.js';
import type {
  ChangeRestaurant,
  GeometryPoint,
  NewRestaurant,
} from '../../models/types.js';
import type { UUID } from 'crypto';
import { sql } from 'kysely';

export class RestaurantRepository {
  private toLocationSql(latitude?: number, longitude?: number) {
    if (latitude === undefined || longitude === undefined) {
      return undefined;
    }

    return sql<GeometryPoint>`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::GEOGRAPHY`;
  }

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
      .execute();
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
      .executeTakeFirst();
  }

  async create(data: NewRestaurant) {
    const { latitude, longitude, ...rest } = data;
    const location = this.toLocationSql(latitude, longitude);

    if (location === undefined) {
      throw new Error('Location is required for restaurant creation');
    }

    return db
      .insertInto('user_restaurants')
      .values({
        ...rest,
        location,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(restaurantId: UUID, userId: UUID, data: ChangeRestaurant) {
    const { latitude, longitude, ...rest } = data;
    const nextLocation = this.toLocationSql(latitude, longitude);
    const updateData = {
      ...rest,
      updated_at: new Date(),
      ...(nextLocation !== undefined ? { location: nextLocation } : {}),
    };

    return db
      .updateTable('user_restaurants')
      .set(updateData)
      .where('user_restaurant_id', '=', restaurantId)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(restaurantId: UUID, userId: UUID) {
    return db
      .deleteFrom('user_restaurants')
      .where('user_restaurant_id', '=', restaurantId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
  }
}
