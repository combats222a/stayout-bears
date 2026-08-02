const repo = require('../repositories/shining.repository');

async function getShining(req) {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Ты не в клане' } };

  const r = await repo.findByClan(req.user.clan_id);
  if (!r) return { status: 200, body: null };

  return {
    status: 200,
    body: {
      anchorIso:    r.anchor_iso,
      anchorRealMs: new Date(r.anchor_iso).getTime(), // для фронтенда
      locationId:   r.location_id,
      gameTimeStr:  r.game_time_str,
      setAt:        r.set_at,
      setByNick:    r.set_by_nick,
    },
  };
}

async function setShining(req) {
  if (!req.user.clan_id) return { status: 403, body: { error: 'Ты не в клане' } };

  const { anchorRealMs, anchorIso, locationId, gameTimeStr } = req.body;
  // Принимаем anchorRealMs (новый формат) или anchorIso (старый)
  const anchorIsoFinal = anchorIso || (anchorRealMs ? new Date(anchorRealMs).toISOString() : null);
  const anchorRealMsFinal = anchorRealMs || (anchorIso ? new Date(anchorIso).getTime() : null);

  if (!anchorIsoFinal || !locationId) return { status: 400, body: { error: 'anchor и locationId обязательны' } };

  const nick  = req.user.game_nick || req.user.nick;
  const setAt = new Date().toISOString();

  await repo.upsert(req.user.clan_id, anchorIsoFinal, locationId, gameTimeStr || '', setAt, nick);

  const payload = {
    anchorIso:    anchorIsoFinal,
    anchorRealMs: anchorRealMsFinal,
    locationId,
    gameTimeStr,
    setAt,
    setByNick: nick,
  };

  req.getIo().to(`clan:${req.user.clan_id}`).emit('shining:update', payload);
  return { status: 200, body: payload };
}

module.exports = { getShining, setShining };
