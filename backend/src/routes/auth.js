const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// Email transporter (configure via .env)
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function genCode6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

  // nick = email (unique login based on email)
  const nick = email.toLowerCase();

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (nick, game_nick, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, nick, game_nick, email, clan_id, is_superadmin',
      [nick, game_nick, email.toLowerCase(), hash]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Send welcome email with a code (just informational, no confirmation required)
    const welcomeCode = genCode6();
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: '🐻 Bear Tracker — Добро пожаловать!',
        html: `
          <div style="font-family:sans-serif;max-width:420px;margin:0 auto">
            <h2>🐻‍❄️ Bear Tracker</h2>
            <p>Ты успешно зарегистрировался!</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Игровой ник:</b> ${game_nick}</p>
            <p>Твой код подтверждения: <b style="font-size:24px;letter-spacing:4px">${welcomeCode}</b></p>
            <p style="color:#888;font-size:12px">Если ты не регистрировался — проигнорируй это письмо.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Mail send error (welcome):', mailErr.message);
      // Don't fail registration if email fails
    }

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

// ── Forgot password — step 1: send code ─────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Укажи email' });

  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    // Always respond OK to not leak whether email exists
    if (!rows.length) return res.json({ ok: true });

    const code = genCode6();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Invalidate old codes for this email
    await pool.query('UPDATE password_reset_codes SET used = TRUE WHERE email = $1', [email.toLowerCase()]);

    await pool.query(
      'INSERT INTO password_reset_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email.toLowerCase(), code, expiresAt]
    );

    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: '🐻 Bear Tracker — Сброс пароля',
        html: `
          <div style="font-family:sans-serif;max-width:420px;margin:0 auto">
            <h2>🐻‍❄️ Bear Tracker</h2>
            <p>Ты запросил сброс пароля.</p>
            <p>Твой код для сброса:</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4a9eff">${code}</p>
            <p>Код действителен <b>15 минут</b>.</p>
            <p style="color:#888;font-size:12px">Если ты не запрашивал сброс пароля — проигнорируй это письмо.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Mail send error (reset):', mailErr.message);
      return res.status(500).json({ error: 'Не удалось отправить письмо. Проверь настройки SMTP.' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Forgot password — step 2: verify code + set new password ─────────────────
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Заполни все поля' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Пароль: минимум 6 символов' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM password_reset_codes
       WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email.toLowerCase(), code]
    );
    if (!rows.length) {
      return res.status(400).json({ error: 'Неверный или просроченный код' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email.toLowerCase()]);
    await pool.query('UPDATE password_reset_codes SET used = TRUE WHERE id = $1', [rows[0].id]);

    res.json({ ok: true });
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
