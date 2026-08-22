import type { Request, Response } from 'express';
import * as service from '../services/tracker.service';
import type { TrackerConfig } from '../services/tracker.config';
import type { AuthedRequest } from '../types/http';

// Одна фабрика на конфиг — вместо двух копий (kill/reset для медведей
// и для драугов) с одинаковой обвязкой try/catch и проверкой клана.
export function makeController(config: TrackerConfig) {
  return {
    kill: async (req: Request, res: Response) => {
      if (!req.user?.clan_id) return res.status(403).json({ error: 'Ты не в клане' });
      try {
        const result = await service.killItem(config, req as AuthedRequest);
        res.status(result.status).json(result.body);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },
    reset: async (req: Request, res: Response) => {
      if (!req.user?.clan_id) return res.status(403).json({ error: 'Ты не в клане' });
      try {
        const result = await service.resetItemAction(config, req as AuthedRequest);
        res.status(result.status).json(result.body);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },
  };
}
