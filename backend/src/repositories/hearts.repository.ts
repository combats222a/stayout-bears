import { pool } from '../db/pool';
import type { LootParticipant } from '../types/entities';

// Поля, которые сервис собирает динамически перед UPDATE — тот же набор,
// что раньше собирался в routes/hearts.js через sets/vals.
export type HeartsUpdateFields = Partial<{
  hearts: number;
  pelts: number;
  finders: string;   // JSON.stringify(finders)
  paid_out: string;  // JSON.stringify(paid_out)
  sold_for: number | null;
}>;

export async function listParticipants(clanId: number): Promise<LootParticipant[]> {
  const { rows } = await pool.query<LootParticipant>(
    'SELECT * FROM loot_participants WHERE clan_id = $1 ORDER BY added_at ASC',
    [clanId]
  );
  return rows;
}

export async function createParticipant(
  clanId: number,
  userId: number | null | undefined,
  nick: string,
  createdBy: number
): Promise<LootParticipant> {
  const { rows } = await pool.query<LootParticipant>(
    `INSERT INTO loot_participants (clan_id, user_id, nick, finders, created_by)
     VALUES ($1, $2, $3, '[]', $4)
     RETURNING *`,
    [clanId, userId || null, nick, createdBy]
  );
  return rows[0];
}

export async function findOwner(id: string | number, clanId: number): Promise<Pick<LootParticipant, 'user_id'> | null> {
  const { rows } = await pool.query<Pick<LootParticipant, 'user_id'>>(
    'SELECT user_id FROM loot_participants WHERE id = $1 AND clan_id = $2',
    [id, clanId]
  );
  return rows[0] || null;
}

// fields — plain object of {column: value}, вставленных сервисом в том же
// порядке, что и раньше строился sets/vals (hearts, pelts, finders,
// paid_out, sold_for) — порядок параметров в итоговом запросе тот же.
export async function updateFields(
  id: string | number,
  clanId: number,
  fields: HeartsUpdateFields
): Promise<LootParticipant | null> {
  const cols = Object.keys(fields) as (keyof HeartsUpdateFields)[];
  const sets = cols.map((c, i) => `${c} = $${i + 1}`);
  const vals: unknown[] = cols.map((c) => fields[c]);
  vals.push(id, clanId);
  const { rows } = await pool.query<LootParticipant>(
    `UPDATE loot_participants SET ${sets.join(', ')}
     WHERE id = $${cols.length + 1} AND clan_id = $${cols.length + 2} RETURNING *`,
    vals
  );
  return rows[0] || null;
}

export async function deleteParticipant(id: string | number, clanId: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM loot_participants WHERE id = $1 AND clan_id = $2',
    [id, clanId]
  );
  return (rowCount ?? 0) > 0;
}

export async function resetParticipants(clanId: number): Promise<void> {
  await pool.query('DELETE FROM loot_participants WHERE clan_id = $1', [clanId]);
}
