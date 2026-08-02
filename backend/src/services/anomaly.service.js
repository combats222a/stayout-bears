const repo = require('../repositories/anomaly.repository');

async function getAnomaly(req) {
  const r = await repo.findByUser(req.user.id);
  if (!r) return { status: 200, body: null };

  return {
    status: 200,
    body: {
      anchorIso:    r.anchor_iso,
      anchorRealMs: new Date(r.anchor_iso).getTime(),
      gameTimeStr:  r.game_time_str,
      setAt:        r.set_at,
      setByNick:    req.user.game_nick || req.user.nick,
    },
  };
}

async function setAnomaly(req) {
  const { anchorRealMs, anchorIso, gameTimeStr } = req.body;
  const anchorIsoFinal = anchorIso || (anchorRealMs ? new Date(anchorRealMs).toISOString() : null);
  const anchorRealMsFinal = anchorRealMs || (anchorIso ? new Date(anchorIso).getTime() : null);

  if (!anchorIsoFinal) return { status: 400, body: { error: 'anchor обязателен' } };

  const setAt = new Date().toISOString();
  await repo.upsert(req.user.id, anchorIsoFinal, gameTimeStr || '', setAt);

  return {
    status: 200,
    body: {
      anchorIso:    anchorIsoFinal,
      anchorRealMs: anchorRealMsFinal,
      gameTimeStr,
      setAt,
      setByNick: req.user.game_nick || req.user.nick,
    },
  };
}

module.exports = { getAnomaly, setAnomaly };
