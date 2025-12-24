import { Router  } from 'express'
import restaurantRoutes from '../restaurants/restaurants.routes'
import { authUser } from '@/middleware/auth'
import { UserController } from './user.controller'
import { SessionRepository } from '../auth/auth.repository'

const router: Router = Router()

const sessionRepo = new SessionRepository()
const userController = new UserController(sessionRepo)

// The "user" route is meant to "group" all of the modules that some
// user has.
router.get('/', userController.getUser)
router.use('/restaurants', authUser, restaurantRoutes)

export default router
