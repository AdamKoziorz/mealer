import type { Request, Response } from 'express';
import type { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';
import { cookie } from '../../config/cookie.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  GoogleSignIn = async (_req: Request, res: Response) => {
    const { url, state } = await this.authService.createGoogleAuthRequest();

    res.cookie(cookie.oAuthStateName, state, {
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: env.oAuthStateTtlMs,
    });

    res.redirect(url);
  };

  GoogleCallback = async (req: Request, res: Response) => {
    try {
      const { sessionToken } = await this.authService.handleGoogleCallback({
        code: req.query.code as string | undefined,
        receivedState: req.query.state as string | undefined,
        expectedState: req.cookies?.[cookie.oAuthStateName] as
          | string
          | undefined,
      });

      res.clearCookie(cookie.oAuthStateName, {
        httpOnly: true,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        path: cookie.path,
      });

      // Secure session cookie
      res.cookie(cookie.sessionName, sessionToken, {
        httpOnly: true,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        maxAge: env.sessionTtlMs,
      });

      res.redirect(env.frontendOrigin);
    } catch (err) {
      res.clearCookie(cookie.oAuthStateName, {
        httpOnly: true,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        path: cookie.path,
      });

      console.warn('Google auth callback failed', {
        message: err instanceof Error ? err.message : String(err),
        hasCode: Boolean(req.query.code),
        hasReceivedState: Boolean(req.query.state),
        hasExpectedState: Boolean(req.cookies?.[cookie.oAuthStateName]),
      });

      res.redirect(`${env.frontendOrigin}/?error=auth_failed`);
    }
  };

  LogOut = async (req: Request, res: Response) => {
    const sessionToken = req.cookies?.[cookie.sessionName] as
      | string
      | undefined;

    if (sessionToken) {
      await this.authService.logout(sessionToken);
      res.clearCookie(cookie.sessionName, {
        httpOnly: true,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        path: cookie.path,
      });
    }

    res.redirect(env.frontendOrigin);
  };
}
