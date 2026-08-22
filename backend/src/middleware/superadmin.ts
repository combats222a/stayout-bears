import type { Request, Response, NextFunction } from 'express';

export function superadmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.is_superadmin) return res.status(403).json({ error: 'Недостаточно прав' });
  next();
}
