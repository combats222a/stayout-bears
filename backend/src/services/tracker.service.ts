import * as repo from '../repositories/tracker.repository';
import type { TrackerConfig } from './tracker.config';
import type { AuthedRequest, ServiceResult } from '../types/http';

// config: одна из BEARS_CONFIG/DRAUGS_CONFIG (services/tracker.config.ts)
// req: тот же Express-запрос, что и раньше — берём req.params/req.body/
// req.user/req.getIo() ровно так же, как делали routes/bears.js и
// routes/draugs.js напрямую. req.user.clan_id! — наличие клана уже
// проверено контроллером (controllers/tracker.controller.ts) до вызова.

export async function killItem(config: TrackerConfig, req: AuthedRequest): Promise<ServiceResult> {
  const index = parseInt(req.params.index);
  if (index < 1 || index > config.maxIndex) {
    return { status: 400, body: { error: `Индекс ${config.nounGenitive} 1-${config.maxIndex}` } };
  }

  const killedAt = req.body.killed_at ? new Date(req.body.killed_at) : new Date();
  const spawnAt  = new Date(killedAt.getTime() + config.respawnMs);

  const row = await repo.upsertKill(config.table, config.indexCol, req.user.clan_id!, index, killedAt, req.user.id, spawnAt);
  const item = { ...row, killer_nick: req.user.game_nick || req.user.nick };

  req.getIo().to(`clan:${req.user.clan_id}`).emit(config.socketEvent, item);
  return { status: 200, body: { [config.responseKey]: item } };
}

export async function resetItemAction(config: TrackerConfig, req: AuthedRequest): Promise<ServiceResult> {
  const index = parseInt(req.params.index);
  if (index < 1 || index > config.maxIndex) {
    return { status: 400, body: { error: `Индекс ${config.nounGenitive} 1-${config.maxIndex}` } };
  }

  const row = await repo.resetItem(config.table, config.indexCol, req.user.clan_id!, index);
  if (!row) return { status: 404, body: { error: `${config.notFoundLabel} не найден` } };

  const item = { ...row, killer_nick: null };
  req.getIo().to(`clan:${req.user.clan_id}`).emit(config.socketEvent, item);
  return { status: 200, body: { [config.responseKey]: item } };
}
