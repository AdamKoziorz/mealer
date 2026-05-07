import { SessionRepository } from '../modules/auth/auth.repository.js';
import type { Request, Response, NextFunction } from 'express';
import { cookie } from '../config/cookie.js';

export async function authUser(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const sessionToken = req.cookies?.[cookie.sessionName] as string | undefined;
  if (!sessionToken) return next();

  const sessionRepo = new SessionRepository();
  const session = await sessionRepo.findValidSession(sessionToken);
  if (!session) return next();

  await sessionRepo.touchSession(sessionToken);
  req.user = { user_id: session.user_id };
  next();
}
