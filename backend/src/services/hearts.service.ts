import * as repo from '../repositories/hearts.repository';
import type { HeartsUpdateFields } from '../repositories/hearts.repository';
import { findMemberInClan } from '../repositories/clan.repository';
import type { AuthedRequest, ServiceResult } from '../types/http';

export async function listParticipants(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 200, body: { participants: [] } };
  const participants = await repo.listParticipants(req.user.clan_id);
  return { status: 200, body: { participants } };
}

export async function createParticipant(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Ты не в клане' } };
  const { nick, user_id } = req.body;
  if (!nick || !nick.trim()) return { status: 400, body: { error: 'Укажи ник' } };

  // ИСПРАВЛЕНО: раньше user_id из тела запроса вставлялся без проверки,
  // что этот аккаунт вообще состоит в клане запрашивающего — можно было
  // привязать строку к ЧУЖОМУ user_id (в т.ч. из другого клана), и по
  // правилу владения в updateParticipant редактировать её потом мог
  // только этот случайный аккаунт, а не участники клана.
  if (user_id != null && !(await findMemberInClan(user_id, req.user.clan_id))) {
    return { status: 400, body: { error: 'Этот игрок не в твоём клане' } };
  }

  const participant = await repo.createParticipant(req.user.clan_id, user_id, nick.trim(), req.user.id);
  req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
  return { status: 200, body: { participant } };
}

export async function updateParticipant(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };
  const { hearts, pelts, sold_for, finders, paid_out } = req.body;

  // "Сердца", "Шкуры", "Продали за", "Участники" и "Выплачено участникам" —
  // редактировать может только тот, чей аккаунт привязан к нику в этой строке
  // (user_id, колонка «НИК»). Если ник «гостевой» (вписан вручную, аккаунта
  // нет — за него некому залогиниться), редактировать может любой участник клана.
  if (hearts !== undefined || pelts !== undefined || sold_for !== undefined ||
      finders !== undefined || paid_out !== undefined) {
    const owner = await repo.findOwner(req.params.id, req.user.clan_id);
    if (!owner) return { status: 404, body: { error: 'Не найден' } };
    const allowed = owner.user_id != null ? owner.user_id === req.user.id : true;
    if (!allowed) {
      return { status: 403, body: { error: 'Редактировать эту графу может только тот, чей ник указан в строке' } };
    }
  }

  const fields: HeartsUpdateFields = {};
  if (hearts   !== undefined) fields.hearts = Math.max(0, hearts);
  if (pelts    !== undefined) fields.pelts = Math.max(0, pelts);
  if (finders  !== undefined) fields.finders = JSON.stringify(finders);
  if (paid_out !== undefined) fields.paid_out = JSON.stringify(paid_out);
  if (sold_for !== undefined) fields.sold_for = (sold_for === '' || sold_for === null) ? null : parseInt(sold_for);

  if (!Object.keys(fields).length) return { status: 400, body: { error: 'Нечего обновлять' } };

  const participant = await repo.updateFields(req.params.id, req.user.clan_id, fields);
  if (!participant) return { status: 404, body: { error: 'Не найден' } };

  req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
  return { status: 200, body: { participant } };
}

export async function deleteParticipant(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };
  const ok = await repo.deleteParticipant(req.params.id, req.user.clan_id);
  if (!ok) return { status: 404, body: { error: 'Не найден' } };
  req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
  return { status: 200, body: { ok: true } };
}

export async function resetParticipants(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };
  await repo.resetParticipants(req.user.clan_id);
  req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
  return { status: 200, body: { ok: true } };
}
