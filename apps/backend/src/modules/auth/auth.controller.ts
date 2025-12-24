import { NextFunction, Request, Response } from 'express'
import { AuthService } from './auth.service'
import { SessionRepository } from './auth.repository';

const VITE_PORT = process.env.VITE_PORT || 6789;
const WEBSITE_URL = process.env.WEBSITE_URL

export class AuthController {
    constructor(
        private authService: AuthService
    ) {}

  GoogleSignIn = async (req: Request, res: Response) => {
    const url = this.authService.getGoogleAuthUrl();
    res.redirect(url);
  }

  GoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = req.query.code as string | undefined;
        const state = req.query.state as string | undefined;

        if (!code || !state) {
            return;
        }

        const { user, session_id } = await this.authService.handleGoogleCallback(code, state);

        res.cookie("session_id", session_id, {
            httpOnly: true,
            secure: false,        // FOR NOW...
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`http://${WEBSITE_URL}:${VITE_PORT}`);
    } catch (err) {
        res.redirect(`${WEBSITE_URL}:${VITE_PORT}/login?error=auth_failed`)
    }
  }

  LogOut = async (req: Request, res: Response) => {
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
        await this.authService.logout(sessionId);
        res.clearCookie("session_id", {
            httpOnly: true,
            sameSite: "lax",
            secure: false      // FOR NOW
        });
    }

    res.redirect(`${process.env.FRONTEND_URL}:${VITE_PORT}`)
  }
}