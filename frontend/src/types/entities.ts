// Типы соответствуют реальной схеме backend/src/db/schema.ts и реальным
// проекциям backend/src/repositories/*.ts (источник истины —
// backend/src/types/entities.ts, теперь он существует).

export interface User {
  id: number;
  nick: string;
  game_nick: string;
  email: string;
  clan_id: number | null;
  is_superadmin: boolean;
  created_at: string;
}

// То, что реально приходит с бэкенда как req.user / GET /auth/me
// (без password_hash — фронтенд его никогда не видит). Совпадает с User,
// alias — для единообразия с backend/src/types/entities.ts, где AuthUser
// действительно отличается от полной строки таблицы.
export type AuthUser = User;

export interface Clan {
  id: number;
  name: string;
  code: string;
  owner_id: number;
  deputy_id: number | null;
  created_at: string;
}

export interface Bear {
  id: number;
  clan_id: number;
  bear_index: number; // 1..11
  killed_at: string | null;
  killed_by: number | null;
  spawn_at: string | null;
}
// То, что реально приходит с бэкенда (GET /clans/me, сокет bear:update) —
// с ником убийцы, посчитанным JOIN'ом на сервере.
export type BearWithKiller = Bear & { killer_nick: string | null };

export interface Draug {
  id: number;
  clan_id: number;
  draug_index: number; // 1..6
  killed_at: string | null;
  killed_by: number | null;
  spawn_at: string | null;
}
export type DraugWithKiller = Draug & { killer_nick: string | null };

export interface Shining {
  clan_id: number;
  anchor_iso: string;
  location_id: string;
  game_time_str: string;
  set_at: string;
  set_by_nick: string;
}

export interface LootParticipant {
  id: number;
  clan_id: number;
  user_id: number | null;
  nick: string;
  hearts: number;
  pelts: number;
  sold_for: number | null;
  finders: string[];
  created_by: number | null;
  paid_out: string[];
  added_at: string;
}

export interface ClanBan {
  id: number;
  clan_id: number;
  user_id: number;
  banned_by: number;
  banned_at: string;
}

// Проекция, которую реально отдаёт GET/POST /timers (без user_id —
// см. TIMER_FIELDS в backend/src/repositories/timers.repository.ts).
// last_reset_at может быть null — таймер можно "очистить" (кнопка "Очистить").
export interface UserTimer {
  id: number;
  name: string;
  period_seconds: number;
  last_reset_at: string | null;
  sort_order: number;
  sound_enabled: boolean;
  created_at: string;
}

export interface UserAnomaly {
  user_id: number;
  anchor_iso: string;
  game_time_str: string;
  set_at: string;
}

// --- Проекции под конкретные ответы API (см. backend/src/repositories/clan.repository.ts) ---

export type ClanMemberSummary = Pick<User, 'id' | 'nick' | 'game_nick' | 'email'>;

// GET /admin/clans → users (без game_nick — см. backend/src/repositories/admin.repository.ts)
export type AdminUserSummary = Pick<User, 'id' | 'nick' | 'email' | 'clan_id' | 'is_superadmin' | 'created_at'>;

export interface ClanBanSummary {
  user_id: number;
  banned_at: string;
  banned_by: number;
  nick: string;
}

// GET /clans/me
export interface ClanFull {
  clan: Clan;
  members: ClanMemberSummary[];
  bears: BearWithKiller[];
  draugs: DraugWithKiller[];
  bans: ClanBanSummary[];
}
