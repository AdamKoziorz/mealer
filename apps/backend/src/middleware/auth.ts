import { SessionRepository } from '../modules/auth/auth.repository'
import { Request, Response, NextFunction } from 'express'

export async function authUser(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.session_id;
  if (!sessionId) return next();

  let sessionRepo = new SessionRepository()
  const session = await sessionRepo.findValidSession(sessionId);
  if (!session) return next();

  req.user = { user_id: session.user_id };
  next();
}
