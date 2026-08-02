const { pool } = require('../db/pool');

// table и indexCol приходят ТОЛЬКО из наших собственных конфигов
// (services/tracker.config.js), никогда напрямую из запроса — поэтому
// интерполяция имени таблицы/колонки в SQL здесь безопасна.

async function upsertKill(table, indexCol, clanId, index, killedAt, killedBy, spawnAt) {
  const { rows } = await pool.query(
    `INSERT INTO ${table} (clan_id, ${indexCol}, killed_at, killed_by, spawn_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (clan_id, ${indexCol})
     DO UPDATE SET killed_at = $3, killed_by = $4, spawn_at = $5
     RETURNING *`,
    [clanId, index, killedAt, killedBy, spawnAt]
  );
  return rows[0];
}

async function resetItem(table, indexCol, clanId, index) {
  const { rows } = await pool.query(
    `UPDATE ${table} SET killed_at = NULL, killed_by = NULL, spawn_at = NULL
     WHERE clan_id = $1 AND ${indexCol} = $2 RETURNING *`,
    [clanId, index]
  );
  return rows[0] || null;
}

module.exports = { upsertKill, resetItem };
