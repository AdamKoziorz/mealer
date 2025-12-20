import { Request, Response, NextFunction } from 'express'

export function authUser(req: Request, res: Response, next: NextFunction) {
    req.user = {
        user_id: '5518dbac-8572-4456-b5c9-dbe23b68e2ac',
        email: 'testuser@email.com'
    }
    next()
}