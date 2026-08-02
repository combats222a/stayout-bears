const { pool } = require('./pool');

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nick VARCHAR(32) UNIQUE NOT NULL,
      game_nick VARCHAR(32) NOT NULL DEFAULT '',
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      clan_id INTEGER,
      is_superadmin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS clans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(64) NOT NULL,
      code CHAR(6) UNIQUE NOT NULL,
      owner_id INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bears (
      id SERIAL PRIMARY KEY,
      clan_id INTEGER NOT NULL,
      bear_index INTEGER NOT NULL CHECK (bear_index BETWEEN 1 AND 11),
      killed_at TIMESTAMPTZ,
      killed_by INTEGER,
      spawn_at TIMESTAMPTZ,
      UNIQUE(clan_id, bear_index)
    );

    CREATE TABLE IF NOT EXISTS draugs (
      id SERIAL PRIMARY KEY,
      clan_id INTEGER NOT NULL,
      draug_index INTEGER NOT NULL CHECK (draug_index BETWEEN 1 AND 6),
      killed_at TIMESTAMPTZ,
      killed_by INTEGER,
      spawn_at TIMESTAMPTZ,
      UNIQUE(clan_id, draug_index)
    );

    -- Shining (Гора Сияния) — одна запись на клан
    CREATE TABLE IF NOT EXISTS shining (
      clan_id      INTEGER PRIMARY KEY REFERENCES clans(id) ON DELETE CASCADE,
      anchor_iso   TIMESTAMPTZ NOT NULL,
      location_id  VARCHAR(16)  NOT NULL DEFAULT 'gmt-1',
      game_time_str VARCHAR(8)  NOT NULL DEFAULT '',
      set_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      set_by_nick  VARCHAR(64)  NOT NULL DEFAULT ''
    );

    -- Loot session participants — учёт сердец и шкур за рейд
    CREATE TABLE IF NOT EXISTS loot_participants (
      id SERIAL PRIMARY KEY,
      clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      nick VARCHAR(64) NOT NULL DEFAULT '',
      hearts INTEGER NOT NULL DEFAULT 0,
      pelts INTEGER NOT NULL DEFAULT 0,
      sold_for INTEGER,
      finders JSONB NOT NULL DEFAULT '[]',
      added_at TIMESTAMPTZ DEFAULT NOW()
    );

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='loot_participants' AND column_name='sold_for'
      ) THEN
        ALTER TABLE loot_participants ADD COLUMN sold_for INTEGER;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='loot_participants' AND column_name='finders'
      ) THEN
        ALTER TABLE loot_participants ADD COLUMN finders JSONB NOT NULL DEFAULT '[]';
      END IF;
    END $$;
    -- Кто добавил строку (только этот игрок может редактировать "Участники" и "Выплачено")
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='loot_participants' AND column_name='created_by'
      ) THEN
        ALTER TABLE loot_participants ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END $$;
    -- Список ников, которым уже выплатили долю по этой строке
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='loot_participants' AND column_name='paid_out'
      ) THEN
        ALTER TABLE loot_participants ADD COLUMN paid_out JSONB NOT NULL DEFAULT '[]';
      END IF;
    END $$;
    -- Убираем UNIQUE ограничение если оно есть (разрешаем несколько строк на одного игрока)
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'loot_participants_clan_id_nick_key'
      ) THEN
        ALTER TABLE loot_participants DROP CONSTRAINT loot_participants_clan_id_nick_key;
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE
    );

    -- clan bans
    CREATE TABLE IF NOT EXISTS clan_bans (
      id SERIAL PRIMARY KEY,
      clan_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      banned_by INTEGER NOT NULL,
      banned_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(clan_id, user_id)
    );

    -- Пользовательские таймеры — видит только создатель
    CREATE TABLE IF NOT EXISTS user_timers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(128) NOT NULL,
      period_seconds INTEGER NOT NULL DEFAULT 3600,
      last_reset_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Аномальные прорывы / Уледная жара — одна запись на аккаунт (не на клан),
    -- видна и настраивается только владельцем аккаунта, как таймеры.
    CREATE TABLE IF NOT EXISTS user_anomaly (
      user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      anchor_iso   TIMESTAMPTZ NOT NULL,
      game_time_str VARCHAR(8) NOT NULL DEFAULT '',
      set_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='user_timers' AND column_name='sort_order'
      ) THEN
        ALTER TABLE user_timers ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
        -- Заполняем существующие таймеры порядком по created_at
        UPDATE user_timers SET sort_order = sub.rn FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
          FROM user_timers
        ) sub WHERE user_timers.id = sub.id;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='user_timers' AND column_name='sound_enabled'
      ) THEN
        ALTER TABLE user_timers ADD COLUMN sound_enabled BOOLEAN NOT NULL DEFAULT FALSE;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='game_nick'
      ) THEN
        ALTER TABLE users ADD COLUMN game_nick VARCHAR(32) NOT NULL DEFAULT '';
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='clans' AND column_name='deputy_id'
      ) THEN
        ALTER TABLE clans ADD COLUMN deputy_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END $$;
    -- Разрешаем нескольким кланам иметь одинаковое название (уникален только код приглашения)
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clans_name_key'
      ) THEN
        ALTER TABLE clans DROP CONSTRAINT clans_name_key;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_clan') THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_clan
          FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE SET NULL NOT VALID;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_clans_owner') THEN
        ALTER TABLE clans ADD CONSTRAINT fk_clans_owner
          FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT NOT VALID;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bears_clan') THEN
        ALTER TABLE bears ADD CONSTRAINT fk_bears_clan
          FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE NOT VALID;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bears_killer') THEN
        ALTER TABLE bears ADD CONSTRAINT fk_bears_killer
          FOREIGN KEY (killed_by) REFERENCES users(id) ON DELETE SET NULL NOT VALID;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_draugs_clan') THEN
        ALTER TABLE draugs ADD CONSTRAINT fk_draugs_clan
          FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE NOT VALID;
      END IF;
    END $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_draugs_killer') THEN
        ALTER TABLE draugs ADD CONSTRAINT fk_draugs_killer
          FOREIGN KEY (killed_by) REFERENCES users(id) ON DELETE SET NULL NOT VALID;
      END IF;
    END $$;
  `);
  console.log('Database schema ready');
}

module.exports = { initSchema };
// PATCH — will be appended below in the actual file
