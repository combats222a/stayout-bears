import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import type { AuthUser } from '../types/entities';

export async function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { id: number };
    const { rows } = await pool.query<AuthUser>(
      'SELECT id, nick, game_nick, email, clan_id, is_superadmin FROM users WHERE id = $1',
      [payload.id]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
