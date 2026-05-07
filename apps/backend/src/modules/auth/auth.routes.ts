import { Router } from "express";
import { AuthRepository, PendingOAuthRepository, SessionRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { authRateLimiter } from "../../config/rateLimiter.js";

export const router: Router = Router();

const sessionRepo = new SessionRepository()
const authRepo = new AuthRepository()
const pendingOAuthRepo = new PendingOAuthRepository()
const authService = new AuthService(authRepo, sessionRepo, pendingOAuthRepo)
const authController = new AuthController(authService)

router.get("/google", authRateLimiter, authController.GoogleSignIn)
router.get("/google/callback", authRateLimiter, authController.GoogleCallback)
router.post("/logout", authRateLimiter, authController.LogOut)

export default router
