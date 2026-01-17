import { Request, Response } from 'express'
import { RestaurantService } from './restaurants.service'
import { UUID } from 'crypto'

export class RestaurantController {
  constructor(
    private restaurantService: RestaurantService
  ) {}

  getUserRestaurants = async (req: Request, res: Response) => {
    try {
      const restaurants = await this.restaurantService.getUserRestaurants(req.user!.user_id)
      res.status(200).json(Array.isArray(restaurants) ? restaurants : [])
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  getRestaurant = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params as { restaurantId: UUID }
      const restaurant = await this.restaurantService.getRestaurantById(
        restaurantId,
        req.user!.user_id
      )
      res.json(restaurant)
    } catch (error) {
      res.status(404).json({ error: (error as Error).message })
    }
  }

  createRestaurant = async (req: Request, res: Response) => {
    try {
      const data = { ...req.body, user_id: req.user!.user_id }
      const restaurant = await this.restaurantService.createRestaurant(data)
      res.status(201).json(restaurant)
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  updateRestaurant = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params as { restaurantId: UUID }
      const restaurant = await this.restaurantService.updateRestaurant(
        restaurantId,
        req.user!.user_id,
        req.body
      )
      res.json(restaurant)
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  deleteRestaurant = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params as { restaurantId: UUID }
      await this.restaurantService.deleteRestaurant(restaurantId, req.user!.user_id)
      res.status(204).send()
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }
}