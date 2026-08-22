// Типы соответствуют реальной схеме backend/src/db/schema.ts.
// Ориентир для фронтенда — frontend/src/types/entities.ts (тот файл
// теперь может ссылаться сюда как на источник истины).

export interface User {
  id: number;
  nick: string;
  game_nick: string;
  email: string;
  password_hash: string;
  clan_id: number | null;
  is_superadmin: boolean;
  created_at: string;
}

// То, что реально кладёт в req.user middleware/auth.ts
// (SELECT без password_hash/created_at).
export type AuthUser = Omit<User, 'password_hash' | 'created_at'>;

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

export interface UserTimer {
  id: number;
  user_id: number;
  name: string;
  period_seconds: number;
  last_reset_at: string | null;
  sort_order: number;
  sound_enabled: boolean;
  created_at: string;
}
// Проекция, которую реально возвращает repositories/timers.repository.ts
// (TIMER_FIELDS — без user_id).
export type TimerRow = Omit<UserTimer, 'user_id'>;

export interface UserAnomaly {
  user_id: number;
  anchor_iso: string;
  game_time_str: string;
  set_at: string;
}

// --- Проекции под конкретные запросы (см. repositories/*) ---

export type ClanMemberSummary = Pick<User, 'id' | 'nick' | 'game_nick' | 'email'>;

export type AdminUserSummary = Pick<User, 'id' | 'nick' | 'email' | 'clan_id' | 'is_superadmin' | 'created_at'>;

export interface ClanBanSummary {
  user_id: number;
  banned_at: string;
  banned_by: number;
  nick: string;
}

export interface ClanFull {
  clan: Clan;
  members: ClanMemberSummary[];
  bears: BearWithKiller[];
  draugs: DraugWithKiller[];
  bans: ClanBanSummary[];
}
