const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { makeController } = require('../controllers/tracker.controller');
const { BEARS_CONFIG } = require('../services/tracker.config');

const controller = makeController(BEARS_CONFIG);

// POST /bears/:index/kill
// body: { killed_at? } — если не передан, используется текущее время (кнопка "Сейчас")
// если передан — кнопка "Исчез" (медведь пропал ~5 мин назад)
router.post('/:index/kill', auth, controller.kill);

// POST /bears/:index/reset
router.post('/:index/reset', auth, controller.reset);

module.exports = router;
