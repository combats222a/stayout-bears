const service = require('../services/tracker.service');

// Одна фабрика на конфиг — вместо двух копий (kill/reset для медведей
// и для драугов) с одинаковой обвязкой try/catch и проверкой клана.
function makeController(config) {
  return {
    kill: async (req, res) => {
      if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });
      try {
        const result = await service.killItem(config, req);
        res.status(result.status).json(result.body);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },
    reset: async (req, res) => {
      if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });
      try {
        const result = await service.resetItemAction(config, req);
        res.status(result.status).json(result.body);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    },
  };
}

module.exports = { makeController };
