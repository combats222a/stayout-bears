import { Router } from 'express';
import { pool } from '../db/pool';

/**
 * Одноразовый HTTP-эндпоинт для создания/повышения администратора —
 * когда нет доступа к терминалу/серверу (деплой только через GitHub веб-
 * интерфейс + автодеплой Vercel).
 *
 * Секрет зашит прямо в код (ниже), без переменных окружения — чтобы
 * достаточно было просто запушить файл на GitHub, без похода в Vercel
 * Dashboard. Секрет служит минимальной защитой от случайных ботов/
 * сканеров, а не полноценной секретностью — сам email и хэш пароля
 * администратора и так уже лежат в этом же файле открытым текстом.
 *
 * Как использовать:
 *   1) Запушить этот файл + обновлённый index.ts на GitHub, дождаться
 *      автодеплоя.
 *   2) Один раз открыть в браузере:
 *        https://ваш-бэкенд/api/bootstrap-admin?secret=bears-bootstrap-2026
 *   3) Убедиться, что в ответе success: true.
 *   4) Удалить этот файл и роут в index.ts — эндпоинт больше не нужен и
 *      не должен оставаться в проде.
 *
 * Если секрет не совпадает — отвечаем 404, а не 401/403, чтобы не
 * подсказывать посторонним, что такой роут вообще существует.
 */
const router = Router();

const BOOTSTRAP_SECRET = 'bears-bootstrap-2026';

const EMAIL = 'combats221@gmail.com';
const GAME_NICK = 'combats221';
// bcrypt.hash('dY2tsP3pqD3upA0', 10) — пароль был выслан отдельным сообщением в чате
const PASSWORD_HASH = '$2a$10$eHVPMR1KyGRkPglUcKwIt.yJd1V3UUUuUwzHiFYireJWVYZW5a3I2';

router.get('/', async (req, res) => {
  const provided = req.query.secret;

  if (provided !== BOOTSTRAP_SECRET) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const nick = EMAIL.toLowerCase();
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [nick]);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = $1, is_superadmin = TRUE WHERE id = $2',
        [PASSWORD_HASH, existing[0].id]
      );
      return res.json({ success: true, action: 'updated', email: EMAIL });
    }

    await pool.query(
      'INSERT INTO users (nick, game_nick, email, password_hash, is_superadmin) VALUES ($1, $2, $3, $4, TRUE)',
      [nick, GAME_NICK, nick, PASSWORD_HASH]
    );
    return res.json({ success: true, action: 'created', email: EMAIL });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
