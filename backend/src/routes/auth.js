const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// ── Register (без поля "логин", nick = email) ────────────────────────────────
router.post('/register', async (req, res) => {
  const { game_nick, email, password } = req.body;
  if (!game_nick || !email || !password) {
    return res.status(400).json({ error: 'Игровой ник, email и пароль обязательны' });
  }
  if (game_nick.length < 2 || game_nick.length > 32) {
    return res.status(400).json({ error: 'Игровой ник: от 2 до 32 символов' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль: минимум 6 символов' });
  }

  const nick = email.toLowerCase();

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (nick, game_nick, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, nick, game_nick, email, clan_id, is_superadmin',
      [nick, game_nick, email.toLowerCase(), hash]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email уже зарегистрирован' });
    }
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Заполни все поля' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE nick = $1 OR email = $1',
      [login.toLowerCase()]
    );
    if (!rows.length) return res.status(401).json({ error: 'Неверный email или пароль' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Get current user ─────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// ── Update profile ───────────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  const { game_nick } = req.body;
  if (!game_nick) return res.status(400).json({ error: 'Нечего обновлять' });

  if (game_nick.length < 2 || game_nick.length > 32) {
    return res.status(400).json({ error: 'Игровой ник: от 2 до 32 символов' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET game_nick = $1 WHERE id = $2 RETURNING id, nick, game_nick, email, clan_id, is_superadmin`,
      [game_nick, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Delete own account ───────────────────────────────────────────────────────
router.delete('/account', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (req.user.clan_id) {
      const { rows: clanRows } = await client.query(
        'SELECT * FROM clans WHERE id = $1', [req.user.clan_id]
      );
      const clan = clanRows[0];
      if (clan && clan.owner_id === req.user.id) {
        const { rows: members } = await client.query(
          'SELECT id FROM users WHERE clan_id = $1 AND id != $2',
          [req.user.clan_id, req.user.id]
        );
        if (members.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: 'Ты владелец клана с участниками. Сначала кикни всех или передай владение.'
          });
        }
        await client.query('DELETE FROM clans WHERE id = $1', [clan.id]);
      } else {
        await client.query('UPDATE users SET clan_id = NULL WHERE id = $1', [req.user.id]);
      }
    }

    await client.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

module.exports = router;
