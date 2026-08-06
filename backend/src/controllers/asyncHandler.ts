import type { Request, RequestHandler } from 'express';
import type { ServiceHandler } from '../types/http';

// Общая обвязка req/res для сервисных функций вида
// async (req) => ({ status, body }). Раньше этот же try/catch→500
// был скопирован в каждом роуте по отдельности (и продублирован ещё раз
// внутри clan.controller.js) — теперь один вариант на все контроллеры.
//
// TReq выводится автоматически из переданной serviceFn (например,
// AuthedRequest для сервисов, которым нужен req.user) — вызывающему
// коду не нужно указывать дженерик явно.
export function wrap<TReq extends Request = Request>(serviceFn: ServiceHandler<TReq>): RequestHandler {
  return async (req, res) => {
    try {
      const result = await serviceFn(req as TReq);
      res.status(result.status).json(result.body);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
}
