import { Router } from 'express'
import { RestaurantController } from './restaurants.controller'
import { RestaurantService } from './restaurants.service'
import { RestaurantRepository } from './restaurants.repository'

const router: Router = Router()

const restaurantRepo = new RestaurantRepository()
const restaurantService = new RestaurantService(restaurantRepo)
const restaurantController = new RestaurantController(restaurantService)

router.get('/', restaurantController.getUserRestaurants)
router.post('/', restaurantController.createRestaurant)
router.get('/:restaurantId',  restaurantController.getRestaurant)
router.put('/:restaurantId', restaurantController.updateRestaurant)
router.delete('/:restaurantId', restaurantController.deleteRestaurant)

export default router
