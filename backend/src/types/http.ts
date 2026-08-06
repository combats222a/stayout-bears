import type { Request } from 'express';
import type { AuthUser } from './entities';

// Запрос, прошедший через middleware/auth.ts — user гарантированно есть.
// Используется в сервисах вместо голого express.Request.
export type AuthedRequest = Request & { user: AuthUser };

export interface ServiceResult<T = unknown> {
  status: number;
  body: T;
}

// Форма сервисной функции вида async (req) => ({ status, body }),
// которую заворачивает controllers/asyncHandler.ts.
export type ServiceHandler<TReq extends Request = Request> =
  (req: TReq) => Promise<ServiceResult> | ServiceResult;
