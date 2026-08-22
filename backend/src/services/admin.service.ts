import * as repo from '../repositories/admin.repository';
import type { AuthedRequest, ServiceResult } from '../types/http';

export async function getClansOverview(): Promise<ServiceResult> {
  const data = await repo.getAllClansOverview();
  return { status: 200, body: data };
}

export async function deleteClan(req: AuthedRequest): Promise<ServiceResult> {
  await repo.deleteClanCascade(req.params.id);
  return { status: 200, body: { ok: true } };
}

export async function resetClanBears(req: AuthedRequest): Promise<ServiceResult> {
  await repo.resetClanBears(req.params.id);
  req.getIo().to(`clan:${req.params.id}`).emit('clan:update');
  return { status: 200, body: { ok: true } };
}

export async function toggleAdmin(req: AuthedRequest): Promise<ServiceResult> {
  if (parseInt(req.params.id) === req.user.id) {
    return { status: 400, body: { error: 'Нельзя изменить свои права' } };
  }
  const user = await repo.toggleSuperadmin(req.params.id);
  return { status: 200, body: { user } };
}
