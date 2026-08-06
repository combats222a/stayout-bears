import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import { pool } from '../db/pool';
import type { SocketUser } from '../types/socket';

export async function socketAuth(socket: Socket, next: (err?: ExtendedError) => void) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { id: number };
    const { rows } = await pool.query<SocketUser>('SELECT id, nick, clan_id FROM users WHERE id = $1', [payload.id]);
    if (!rows.length) return next(new Error('User not found'));
    socket.user = rows[0];
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}
