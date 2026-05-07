import { Router } from 'express';
import restaurantRoutes from '../restaurants/restaurants.routes.js';
import { UserController } from './user.controller.js';
import { SessionRepository } from '../auth/auth.repository.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { apiRateLimiter } from '../../config/rateLimiter.js';

const router: Router = Router();

const sessionRepo = new SessionRepository();
const userController = new UserController(sessionRepo);

// The "user" route is meant to "group" all of the modules that some
// user has.
router.get('/', apiRateLimiter, userController.getUser);
router.use('/restaurants', requireAuth, apiRateLimiter, restaurantRoutes);

export default router;
