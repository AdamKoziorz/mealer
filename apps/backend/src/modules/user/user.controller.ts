import type { Request, Response } from 'express';
import type { SessionRepository } from '../auth/auth.repository.js';

export class UserController {
  constructor(private sessionRepo: SessionRepository) {}

  getUser = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.sendStatus(401);
      return;
    }

    res.status(200).json({
      user_id: req.user.user_id,
    });
  };
}
