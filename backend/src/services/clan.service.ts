import * as repo from '../repositories/clan.repository';
import type { AuthedRequest, ServiceResult } from '../types/http';

function genCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

async function generateUniqueCode(): Promise<string> {
  let code: string;
  let exists = true;
  do {
    code = genCode();
    exists = await repo.codeExists(code);
  } while (exists);
  return code;
}

export async function createClan(req: AuthedRequest): Promise<ServiceResult> {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return { status: 400, body: { error: 'Название клана: минимум 2 символа' } };
  if (req.user.clan_id) return { status: 400, body: { error: 'Ты уже в клане. Сначала выйди.' } };

  const code = await generateUniqueCode();
  const clan = await repo.createClanWithSeed(name.trim(), code, req.user.id);
  req.getIo().to(`clan:${clan.id}`).emit('clan:update');
  return { status: 200, body: { clan } };
}

export async function joinClan(req: AuthedRequest): Promise<ServiceResult> {
  const { code } = req.body;
  if (!code) return { status: 400, body: { error: 'Укажи код клана' } };
  if (req.user.clan_id) return { status: 400, body: { error: 'Ты уже в клане' } };

  const clan = await repo.findClanByCode(code.toUpperCase());
  if (!clan) return { status: 404, body: { error: 'Клан не найден' } };

  const banned = await repo.findBan(clan.id, req.user.id);
  if (banned) return { status: 403, body: { error: 'Ты заблокирован в этой группировке' } };

  await repo.setUserClan(req.user.id, clan.id);
  req.getIo().to(`clan:${clan.id}`).emit('clan:update');
  return { status: 200, body: { clan } };
}

export async function leaveClan(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 400, body: { error: 'Ты не в клане' } };

  const clan = await repo.findClanById(req.user.clan_id);
  if (clan && clan.owner_id === req.user.id) {
    const othersCount = await repo.countOtherMembers(req.user.clan_id, req.user.id);
    if (othersCount > 0) {
      return { status: 400, body: { error: 'Ты лидер. Передай лидерство или кикни всех участников.' } };
    }
    await repo.deleteClan(clan.id);
  }
  await repo.clearUserClan(req.user.id);
  return { status: 200, body: { ok: true } };
}

export async function getMyClan(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 200, body: { clan: null, members: [], bears: [], draugs: [], bans: [] } };

  const full = await repo.getClanFull(req.user.clan_id);
  if (!full) return { status: 200, body: { clan: null, members: [], bears: [], draugs: [], bans: [] } };
  return { status: 200, body: full };
}

export async function kickMember(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };

  const ownerDeputy = await repo.getOwnerDeputy(req.user.clan_id);
  if (!ownerDeputy) return { status: 404, body: { error: 'Клан не найден' } };
  const { owner_id, deputy_id } = ownerDeputy;
  const isOwner = owner_id === req.user.id;
  const isDeputy = deputy_id === req.user.id;
  if (!isOwner && !isDeputy) return { status: 403, body: { error: 'Недостаточно прав' } };

  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) return { status: 400, body: { error: 'Нельзя кикнуть себя' } };
  if (!isOwner && targetId === owner_id) return { status: 403, body: { error: 'Зам не может кикнуть лидера' } };
  if (!isOwner && targetId === deputy_id) return { status: 403, body: { error: 'Зам не может кикнуть другого зама' } };

  if (targetId === deputy_id) await repo.clearDeputy(req.user.clan_id);
  await repo.clearUserClanIfMatches(targetId, req.user.clan_id);
  req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
  return { status: 200, body: { ok: true } };
}

export async function banMember(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };

  const ownerDeputy = await repo.getOwnerDeputy(req.user.clan_id);
  if (!ownerDeputy) return { status: 404, body: { error: 'Клан не найден' } };
  const { owner_id, deputy_id } = ownerDeputy;
  const isOwner = owner_id === req.user.id;
  const isDeputy = deputy_id === req.user.id;
  if (!isOwner && !isDeputy) return { status: 403, body: { error: 'Недостаточно прав' } };

  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) return { status: 400, body: { error: 'Нельзя заблокировать себя' } };
  if (targetId === owner_id) return { status: 403, body: { error: 'Нельзя заблокировать лидера' } };
  if (!isOwner && targetId === deputy_id) return { status: 403, body: { error: 'Зам не может заблокировать другого зама' } };

  // Kick from clan first
  if (targetId === deputy_id) await repo.clearDeputy(req.user.clan_id);
  await repo.clearUserClanIfMatches(targetId, req.user.clan_id);

  await repo.insertBan(req.user.clan_id, targetId, req.user.id);

  req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
  return { status: 200, body: { ok: true } };
}

export async function unbanMember(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };

  const owner = await repo.getOwnerId(req.user.clan_id);
  if (!owner) return { status: 404, body: { error: 'Клан не найден' } };
  if (owner.owner_id !== req.user.id) return { status: 403, body: { error: 'Только лидер может разбанить' } };

  const targetId = parseInt(req.params.userId);
  await repo.deleteBan(req.user.clan_id, targetId);
  req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
  return { status: 200, body: { ok: true } };
}

export async function transferLeadership(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };

  const owner = await repo.getOwnerId(req.user.clan_id);
  if (!owner) return { status: 404, body: { error: 'Клан не найден' } };
  if (owner.owner_id !== req.user.id) return { status: 403, body: { error: 'Только лидер может передать власть' } };

  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) return { status: 400, body: { error: 'Это уже ты' } };

  const isMember = await repo.findMemberInClan(targetId, req.user.clan_id);
  if (!isMember) return { status: 404, body: { error: 'Игрок не в клане' } };

  await repo.transferOwnership(targetId, req.user.clan_id);
  req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
  return { status: 200, body: { ok: true } };
}

export async function setDeputy(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };

  const ownerDeputy = await repo.getOwnerDeputy(req.user.clan_id);
  if (!ownerDeputy) return { status: 404, body: { error: 'Клан не найден' } };
  if (ownerDeputy.owner_id !== req.user.id) return { status: 403, body: { error: 'Только лидер может назначать зама' } };

  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) return { status: 400, body: { error: 'Нельзя назначить себя замом' } };

  const newDeputy = ownerDeputy.deputy_id === targetId ? null : targetId;
  await repo.setDeputy(req.user.clan_id, newDeputy);
  req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
  return { status: 200, body: { ok: true, deputy_id: newDeputy } };
}

export async function renameClan(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };
  const { name } = req.body;
  if (!name || name.trim().length < 2) return { status: 400, body: { error: 'Название клана: минимум 2 символа' } };
  if (name.trim().length > 64) return { status: 400, body: { error: 'Название клана: максимум 64 символа' } };

  const owner = await repo.getOwnerId(req.user.clan_id);
  if (!owner) return { status: 404, body: { error: 'Клан не найден' } };
  if (owner.owner_id !== req.user.id) return { status: 403, body: { error: 'Только лидер может переименовать группировку' } };

  const clan = await repo.renameClan(req.user.clan_id, name.trim());
  req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
  return { status: 200, body: { clan } };
}

export async function refreshCode(req: AuthedRequest): Promise<ServiceResult> {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Нет клана' } };

  const ownerDeputy = await repo.getOwnerDeputy(req.user.clan_id);
  if (!ownerDeputy) return { status: 404, body: { error: 'Клан не найден' } };
  const { owner_id, deputy_id } = ownerDeputy;
  if (owner_id !== req.user.id && deputy_id !== req.user.id) {
    return { status: 403, body: { error: 'Недостаточно прав' } };
  }

  const code = await generateUniqueCode();
  const clan = await repo.setCode(req.user.clan_id, code);
  req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
  return { status: 200, body: { clan } };
}
