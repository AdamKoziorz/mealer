import type { NextFunction, Request, Response } from 'express';
import { RestaurantService } from './restaurants.service.js';
import type { UUID } from 'crypto';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from '@mealer/schemas/restaurant';

export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  getUserRestaurants = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.user_id as UUID;
      const restaurants =
        await this.restaurantService.getUserRestaurants(userId);
      res.status(200).json(Array.isArray(restaurants) ? restaurants : []);
    } catch (error) {
      next(error);
    }
  };

  getRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params as { restaurantId: string };
      const userId = req.user!.user_id as UUID;
      const restaurant = await this.restaurantService.getRestaurantById(
        restaurantId as UUID,
        userId
      );
      res.json(restaurant);
    } catch (error) {
      next(error);
    }
  };

  createRestaurant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = createRestaurantSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'Invalid input', details: parsed.error.flatten() });
        return;
      }
      const restaurant = await this.restaurantService.createRestaurant({
        ...parsed.data,
        user_id: req.user!.user_id,
      });
      res.status(201).json(restaurant);
    } catch (error) {
      next(error);
    }
  };

  updateRestaurant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { restaurantId } = req.params as { restaurantId: string };
      const userId = req.user!.user_id as UUID;
      const parsed = updateRestaurantSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'Invalid input', details: parsed.error.flatten() });
        return;
      }
      const restaurant = await this.restaurantService.updateRestaurant(
        restaurantId as UUID,
        userId,
        parsed.data
      );
      res.json(restaurant);
    } catch (error) {
      next(error);
    }
  };

  deleteRestaurant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { restaurantId } = req.params as { restaurantId: string };
      const userId = req.user!.user_id as UUID;
      await this.restaurantService.deleteRestaurant(
        restaurantId as UUID,
        userId
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
