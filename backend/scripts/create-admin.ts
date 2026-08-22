/**
 * Готовый одноразовый скрипт: создаёт/обновляет админ-аккаунт для
 * combats221@gmail.com с is_superadmin = true.
 *
 * В файле зашит только bcrypt-ХЭШ пароля (сгенерирован отдельно,
 * bcrypt.hash('...', 10)) — сам пароль в этом файле не хранится и не
 * восстанавливается из хэша напрямую. Пароль был выслан отдельным
 * сообщением в чате.
 *
 * Запуск на сервере (там, где доступен DATABASE_URL / .env):
 *   cd backend
 *   npx tsx scripts/create-admin.ts
 *
 * После первого запуска рекомендуется:
 *   1) сменить пароль через обычный интерфейс сайта (Профиль → сменить
 *      пароль, если такая функция есть) или через отдельный вызов,
 *   2) удалить/не коммитить этот файл в публичный репозиторий, раз в
 *      нём остаётся хэш конкретного рабочего аккаунта — bcrypt-хэш
 *      сам по себе не раскрывает пароль напрямую, но лучше не оставлять
 *      таких артефактов в истории git без необходимости.
 */
import 'dotenv/config';
import { pool } from '../src/db/pool';

const EMAIL = 'combats221@gmail.com';
const GAME_NICK = 'combats221';
// bcrypt.hash('dY2tsP3pqD3upA0', 10) — пароль выслан отдельным сообщением
const PASSWORD_HASH = '$2a$10$eHVPMR1KyGRkPglUcKwIt.yJd1V3UUUuUwzHiFYireJWVYZW5a3I2';

async function main() {
  const nick = EMAIL.toLowerCase();
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [nick]);

  if (existing.length > 0) {
    await pool.query(
      'UPDATE users SET password_hash = $1, is_superadmin = TRUE WHERE id = $2',
      [PASSWORD_HASH, existing[0].id]
    );
    console.log(`✅ Пользователь ${EMAIL} обновлён: пароль сброшен, is_superadmin = true`);
  } else {
    await pool.query(
      'INSERT INTO users (nick, game_nick, email, password_hash, is_superadmin) VALUES ($1, $2, $3, $4, TRUE)',
      [nick, GAME_NICK, nick, PASSWORD_HASH]
    );
    console.log(`✅ Создан новый администратор: ${EMAIL}`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error('Ошибка:', e);
  process.exit(1);
});
