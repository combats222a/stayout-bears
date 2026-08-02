// Общая обвязка req/res для сервисных функций вида
// async (req) => ({ status, body }). Раньше этот же try/catch→500
// был скопирован в каждом роуте по отдельности (и продублирован ещё раз
// внутри clan.controller.js) — теперь один вариант на все контроллеры.
function wrap(serviceFn) {
  return async (req, res) => {
    try {
      const result = await serviceFn(req);
      res.status(result.status).json(result.body);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
}

module.exports = { wrap };
