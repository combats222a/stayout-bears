const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

async function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, nick, clan_id FROM users WHERE id = $1', [payload.id]);
    if (!rows.length) return next(new Error('User not found'));
    socket.user = rows[0];
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}

module.exports = { socketAuth };
