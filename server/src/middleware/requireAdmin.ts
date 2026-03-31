import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './requireAuth.js';

/**
 * Role-Based Access Control middleware for admin-only routes.
 * Must be used AFTER `requireAuth`.
 * Returns 403 for authenticated users who are not admins.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
