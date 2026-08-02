const repo = require('../repositories/admin.repository');

async function getClansOverview() {
  const data = await repo.getAllClansOverview();
  return { status: 200, body: data };
}

async function deleteClan(req) {
  await repo.deleteClanCascade(req.params.id);
  return { status: 200, body: { ok: true } };
}

async function resetClanBears(req) {
  await repo.resetClanBears(req.params.id);
  req.getIo().to(`clan:${req.params.id}`).emit('clan:update');
  return { status: 200, body: { ok: true } };
}

async function toggleAdmin(req) {
  if (parseInt(req.params.id) === req.user.id) {
    return { status: 400, body: { error: 'Нельзя изменить свои права' } };
  }
  const user = await repo.toggleSuperadmin(req.params.id);
  return { status: 200, body: { user } };
}

module.exports = { getClansOverview, deleteClan, resetClanBears, toggleAdmin };
