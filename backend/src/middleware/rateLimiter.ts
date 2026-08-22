import type { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';

// Защита от повторных регистраций с одного IP: не чаще 1 раза в 168 часов.
//
// Важно: бэкенд задеплоен на Vercel (serverless) — там нет гарантии, что
// повторный запрос попадёт в тот же процесс/инстанс функции, поэтому
// in-memory ограничители (например, express-rate-limit со стандартным
// MemoryStore) не работают надёжно: счётчик обнуляется между "холодными"
// стартами и не общий между параллельными инстансами. Поэтому состояние
// храним в Postgres (таблица registration_attempts, см. db/schema.ts) —
// он у проекта уже есть и переживает рестарты/множественные инстансы.
const WINDOW_MS = 168 * 60 * 60 * 1000; // 168 часов

export function getClientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || 'unknown').toString();
}

export async function registerRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  try {
    const { rows } = await pool.query<{ created_at: string }>(
      'SELECT created_at FROM registration_attempts WHERE ip = $1',
      [ip]
    );
    if (rows.length > 0) {
      const elapsed = Date.now() - new Date(rows[0].created_at).getTime();
      if (elapsed < WINDOW_MS) {
        return res.status(429).json({ error: 'Слишком много попыток регистрации с этого IP. Попробуйте позже.' });
      }
    }
    next();
  } catch (e) {
    next(e);
  }
}

// Вызывается из auth.service.ts только после УСПЕШНОГО создания пользователя —
// неудачные попытки (например, опечатка в пароле или "email уже занят")
// не должны сжигать лимит на 168 часов.
export async function recordRegistrationAttempt(ip: string): Promise<void> {
  await pool.query(
    `INSERT INTO registration_attempts (ip, created_at) VALUES ($1, NOW())
     ON CONFLICT (ip) DO UPDATE SET created_at = NOW()`,
    [ip]
  );
}
