const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { nick, email, password } = req.body;
  if (!nick || !email || !password) {
    return res.status(400).json({ error: 'nick, email и password обязательны' });
  }
  if (nick.length < 2 || nick.length > 32) {
    return res.status(400).json({ error: 'Ник: от 2 до 32 символов' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (nick, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nick, email, clan_id, is_superadmin',
      [nick, email, hash]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    if (e.code === '23505') {
      const field = e.constraint?.includes('nick') ? 'Ник' : 'Email';
      return res.status(409).json({ error: `${field} уже занят` });
    }
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Заполни все поля' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE nick = $1 OR email = $1',
      [login]
    );
    if (!rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get current user
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
