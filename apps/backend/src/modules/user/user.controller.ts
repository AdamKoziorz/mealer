import { Request, Response } from 'express'
import { UUID } from 'crypto'
import { SessionRepository } from '../auth/auth.repository';

export class UserController {
  constructor(private sessionRepo: SessionRepository) {}

  getUser = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.cookies?.session_id as UUID;
  
    if (!sessionId) {
      res.sendStatus(401);
      return;
    }
  
    const user = await this.sessionRepo.findValidSession(sessionId);
  
    if (!user) {
      res.sendStatus(401);
      return;
    }
  
    res.status(200).json({
      user_id: user.user_id,
    });
  }
}
