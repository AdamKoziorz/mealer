import { Router } from 'express'
import { RestaurantController } from './restaurants.controller.js'
import { RestaurantService } from './restaurants.service.js'
import { RestaurantRepository } from './restaurants.repository.js'

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
