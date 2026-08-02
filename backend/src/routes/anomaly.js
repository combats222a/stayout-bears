const router = require('express').Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/anomaly.controller');

// Аномальные прорывы / Ледяная жара — в отличие от Сияния (одна запись
// на клан), здесь одна запись на АККАУНТ: видит и настраивает только
// сам игрок, независимо от того, в каком он клане.
router.get('/', auth, controller.get);
router.post('/set', auth, controller.set);

module.exports = router;
