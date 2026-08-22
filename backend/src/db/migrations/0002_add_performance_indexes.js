// Postgres не создаёт индекс на колонку внешнего ключа автоматически — только
// на PRIMARY KEY/UNIQUE. Эти три колонки участвуют в WHERE самых частых
// запросов бэкенда и до этой миграции сканировались последовательно:
//   * users.clan_id             — getMembers (loadClan: при входе, при каждом
//     socket clan:update, и раз в 30с polling с КАЖДОГО открытого клиента)
//   * loot_participants.clan_id — список сердец/шкур на странице "Учёт лута"
//   * user_timers.user_id       — список таймеров игрока
// Зеркалит соответствующее добавление в backend/src/db/schema.ts.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_users_clan_id ON users(clan_id);
    CREATE INDEX IF NOT EXISTS idx_loot_participants_clan_id ON loot_participants(clan_id);
    CREATE INDEX IF NOT EXISTS idx_user_timers_user_id ON user_timers(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_clan_id;
    DROP INDEX IF EXISTS idx_loot_participants_clan_id;
    DROP INDEX IF EXISTS idx_user_timers_user_id;
  `);
};
