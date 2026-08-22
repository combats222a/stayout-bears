import { pool } from '../db/pool';

// table и indexCol приходят ТОЛЬКО из наших собственных конфигов
// (services/tracker.config.ts), никогда напрямую из запроса — поэтому
// интерполяция имени таблицы/колонки в SQL здесь безопасна.
//
// Колонка индекса (bear_index/draug_index) зависит от config, поэтому
// строкой её типизировать нет смысла — берём фиксированные поля и
// добавляем индекс-сигнатуру под неё.
export interface TrackerRow {
  id: number;
  clan_id: number;
  killed_at: string | null;
  killed_by: number | null;
  spawn_at: string | null;
  [key: string]: unknown;
}

export async function upsertKill(
  table: 'bears' | 'draugs',
  indexCol: 'bear_index' | 'draug_index',
  clanId: number,
  index: number,
  killedAt: Date,
  killedBy: number,
  spawnAt: Date
): Promise<TrackerRow> {
  const { rows } = await pool.query<TrackerRow>(
    `INSERT INTO ${table} (clan_id, ${indexCol}, killed_at, killed_by, spawn_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (clan_id, ${indexCol})
     DO UPDATE SET killed_at = $3, killed_by = $4, spawn_at = $5
     RETURNING *`,
    [clanId, index, killedAt, killedBy, spawnAt]
  );
  return rows[0];
}

export async function resetItem(
  table: 'bears' | 'draugs',
  indexCol: 'bear_index' | 'draug_index',
  clanId: number,
  index: number
): Promise<TrackerRow | null> {
  const { rows } = await pool.query<TrackerRow>(
    `UPDATE ${table} SET killed_at = NULL, killed_by = NULL, spawn_at = NULL
     WHERE clan_id = $1 AND ${indexCol} = $2 RETURNING *`,
    [clanId, index]
  );
  return rows[0] || null;
}
