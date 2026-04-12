import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
    clinicId: string | null;
  };
}

/**
 * Centralized JWT auth middleware.
 * Attaches `req.user` on success; returns 401 on missing/invalid token.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (req as AuthenticatedRequest).user = payload as AuthenticatedRequest['user'];
  next();
}
