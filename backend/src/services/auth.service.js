const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../repositories/auth.repository');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

async function register(req) {
  const { game_nick, email, password } = req.body;
  if (!game_nick || !email || !password) {
    return { status: 400, body: { error: 'Игровой ник, email и пароль обязательны' } };
  }
  if (game_nick.length < 2 || game_nick.length > 32) {
    return { status: 400, body: { error: 'Игровой ник: от 2 до 32 символов' } };
  }
  if (password.length < 6) {
    return { status: 400, body: { error: 'Пароль: минимум 6 символов' } };
  }

  const nick = email.toLowerCase();
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await repo.createUser(nick, game_nick, email.toLowerCase(), hash);
    const token = signToken(user.id);
    return { status: 200, body: { token, user } };
  } catch (e) {
    if (e.code === '23505') {
      return { status: 409, body: { error: 'Email уже зарегистрирован' } };
    }
    throw e;
  }
}

async function login(req) {
  const { login: loginField, password } = req.body;
  if (!loginField || !password) return { status: 400, body: { error: 'Заполни все поля' } };

  const user = await repo.findByLoginOrEmail(loginField.toLowerCase());
  if (!user) return { status: 401, body: { error: 'Неверный email или пароль' } };

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return { status: 401, body: { error: 'Неверный email или пароль' } };

  const token = signToken(user.id);
  const { password_hash, ...safeUser } = user;
  return { status: 200, body: { token, user: safeUser } };
}

function getMe(req) {
  return { status: 200, body: { user: req.user } };
}

async function updateProfile(req) {
  const { game_nick } = req.body;
  if (!game_nick) return { status: 400, body: { error: 'Нечего обновлять' } };
  if (game_nick.length < 2 || game_nick.length > 32) {
    return { status: 400, body: { error: 'Игровой ник: от 2 до 32 символов' } };
  }

  const user = await repo.updateGameNick(req.user.id, game_nick);
  return { status: 200, body: { user } };
}

async function deleteAccount(req) {
  const result = await repo.deleteAccountTx(req.user.id, req.user.clan_id);
  if (result.blocked) {
    return { status: 400, body: { error: 'Ты владелец клана с участниками. Сначала кикни всех или передай владение.' } };
  }
  return { status: 200, body: { ok: true } };
}

module.exports = { register, login, getMe, updateProfile, deleteAccount };
