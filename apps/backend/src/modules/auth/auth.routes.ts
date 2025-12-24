import { Router, RequestHandler, Request, Response } from "express";
import { AuthRepository, SessionRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

export const router = Router();

const sessionRepo = new SessionRepository()
const authRepo = new AuthRepository()
const authService = new AuthService(authRepo, sessionRepo)
const authController = new AuthController(authService)

router.get("/google", authController.GoogleSignIn)
router.get("/google/callback", authController.GoogleCallback)
router.post("/logout", authController.LogOut)

export default router
