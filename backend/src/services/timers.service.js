const repo = require('../repositories/timers.repository');

async function listTimers(req) {
  const timers = await repo.listTimers(req.user.id);
  return { status: 200, body: { timers } };
}

async function createTimer(req) {
  const { name, period_seconds } = req.body;
  if (!name || !name.trim()) return { status: 400, body: { error: 'Укажите название' } };
  if (!period_seconds || period_seconds < 60) return { status: 400, body: { error: 'Период минимум 1 минута' } };

  const nextOrder = await repo.getNextSortOrder(req.user.id);
  const timer = await repo.createTimer(req.user.id, name.trim(), period_seconds, nextOrder);
  return { status: 200, body: { timer } };
}

async function updateTimer(req) {
  const { name, period_seconds, remaining_seconds, sound_enabled } = req.body;

  const sets = [];
  const values = [];
  let i = 1;

  if (name !== undefined) {
    if (!name.trim()) return { status: 400, body: { error: 'Укажите название' } };
    sets.push(`name = $${i++}`); values.push(name.trim());
  }
  if (period_seconds !== undefined) {
    if (!period_seconds || period_seconds < 60) return { status: 400, body: { error: 'Период минимум 1 минута' } };
    sets.push(`period_seconds = $${i++}`); values.push(period_seconds);
  }

  if (remaining_seconds !== undefined) {
    // Ручная правка именно "оставшегося времени" (например, забыли вовремя
    // нажать "Обновить" и хотят вручную поставить сколько реально осталось),
    // не трогая при этом сам период-шаблон. Пересчитываем last_reset_at так,
    // чтобы (last_reset_at + период) дало нужный момент истечения:
    //   last_reset_at = сейчас + remaining_seconds − период
    if (remaining_seconds < 0) return { status: 400, body: { error: 'Оставшееся время не может быть отрицательным' } };

    let effectivePeriod = period_seconds;
    if (effectivePeriod === undefined) {
      const cur = await repo.findPeriodSeconds(req.params.id, req.user.id);
      if (!cur) return { status: 404, body: { error: 'Таймер не найден' } };
      effectivePeriod = cur.period_seconds;
    }

    const lastResetAt = new Date(Date.now() + remaining_seconds * 1000 - effectivePeriod * 1000);
    sets.push(`last_reset_at = $${i++}`); values.push(lastResetAt);
  } else if (period_seconds !== undefined) {
    // Старое поведение: если период поменяли, а оставшееся время явно не
    // задавали — просто сбрасываем отсчёт на "сейчас" (полный новый период).
    sets.push('last_reset_at = NOW()');
  }

  if (sound_enabled !== undefined) {
    sets.push(`sound_enabled = $${i++}`); values.push(!!sound_enabled);
  }
  if (!sets.length) return { status: 400, body: { error: 'Нечего изменять' } };

  const timer = await repo.runUpdate(sets, values, req.params.id, req.user.id);
  if (!timer) return { status: 404, body: { error: 'Таймер не найден' } };
  return { status: 200, body: { timer } };
}

async function reorderTimers(req) {
  const { order } = req.body;
  if (!Array.isArray(order) || !order.length) return { status: 400, body: { error: 'Неверный формат' } };

  const timers = await repo.reorderTimers(order, req.user.id);
  return { status: 200, body: { timers } };
}

async function resetTimer(req) {
  const timer = await repo.resetTimer(req.params.id, req.user.id);
  if (!timer) return { status: 404, body: { error: 'Таймер не найден' } };
  return { status: 200, body: { timer } };
}

async function clearTimer(req) {
  const timer = await repo.clearTimer(req.params.id, req.user.id);
  if (!timer) return { status: 404, body: { error: 'Таймер не найден' } };
  return { status: 200, body: { timer } };
}

async function deleteTimer(req) {
  const ok = await repo.deleteTimer(req.params.id, req.user.id);
  if (!ok) return { status: 404, body: { error: 'Таймер не найден' } };
  return { status: 200, body: { ok: true } };
}

module.exports = { listTimers, createTimer, updateTimer, reorderTimers, resetTimer, clearTimer, deleteTimer };
