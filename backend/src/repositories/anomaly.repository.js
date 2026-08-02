const { pool } = require('../db/pool');

async function findByUser(userId) {
  const { rows } = await pool.query(
    `SELECT anchor_iso, game_time_str, set_at
     FROM user_anomaly WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function upsert(userId, anchorIso, gameTimeStr, setAt) {
  await pool.query(
    `INSERT INTO user_anomaly (user_id, anchor_iso, game_time_str, set_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id) DO UPDATE
       SET anchor_iso=$2, game_time_str=$3, set_at=$4`,
    [userId, anchorIso, gameTimeStr, setAt]
  );
}

module.exports = { findByUser, upsert };
