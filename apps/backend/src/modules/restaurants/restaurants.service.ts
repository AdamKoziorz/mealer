import { NewRestaurant } from '@/models/types'
import { RestaurantRepository } from './restaurants.repository'
import { UUID } from 'crypto'



export class RestaurantService {
  constructor(private restaurantRepo: RestaurantRepository) {}

  // Helper functions for validation
  private validateLocation(latitude?: number, longitude?: number) {
    if ((latitude === undefined) !== (longitude === undefined)) {
      throw new Error('Both latitude and longitude must be provided together');
    }
    
    if (latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
    }
    
    if (longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
    }
  }

  private validateRating(rating: number | null) {
    if (rating && (rating < 1 || rating > 10)) {
      throw new Error('Rating must be between 0 and 10')
    }
  }

  private validatePriceRange(price_range: number | null) {
    if (price_range && (price_range < 1 || price_range > 5)) {
      throw new Error('Price range must be between 1 and 5')
    }
  }



  async getUserRestaurants(userId: UUID) {
    const restaurants = await this.restaurantRepo.findByUserId(userId)
    return restaurants
  }

  async getRestaurantById(restaurantId: UUID, userId: UUID) {
    const restaurant = await this.restaurantRepo.findById(restaurantId, userId)
    if (!restaurant) {
      throw new Error('Restaurant not found')
    }
    return restaurant
  }

  async createRestaurant(data: NewRestaurant) {
    this.validateLocation(data.latitude, data.longitude)
    this.validatePriceRange(data.price_range!)
    this.validateRating(data.rating!)

    return this.restaurantRepo.create(data)
  }

  async updateRestaurant(
    restaurantId: UUID,
    userId: UUID,
    data: NewRestaurant
  ) {
    this.validateLocation(data.latitude, data.longitude)
    this.validatePriceRange(data.price_range!)
    this.validateRating(data.rating!)

    const updated = await this.restaurantRepo.update(restaurantId, userId, data)
    if (!updated) {
      throw new Error('Restaurant not found')
    }
    return updated
  }


  async deleteRestaurant(restaurantId: UUID, userId: UUID) {
    const deleted = await this.restaurantRepo.delete(restaurantId, userId)
    if (deleted.numDeletedRows === BigInt(0)) {
      throw new Error('Restaurant not found or could not be deleted')
    }
  }
}