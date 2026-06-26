const { pool } = require('./pool');

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nick VARCHAR(32) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      clan_id INTEGER,
      is_superadmin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(64) UNIQUE NOT NULL,
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

    ALTER TABLE users ADD CONSTRAINT fk_users_clan
      FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE SET NULL
      NOT VALID;

    ALTER TABLE clans ADD CONSTRAINT fk_clans_owner
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
      NOT VALID;

    ALTER TABLE bears ADD CONSTRAINT fk_bears_clan
      FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE
      NOT VALID;

    ALTER TABLE bears ADD CONSTRAINT fk_bears_killer
      FOREIGN KEY (killed_by) REFERENCES users(id) ON DELETE SET NULL
      NOT VALID;
  `);

  console.log('✅ Database schema ready');
}

module.exports = { initSchema };
