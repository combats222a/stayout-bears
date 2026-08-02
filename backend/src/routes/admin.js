const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { superadmin } = require('../middleware/superadmin');
const controller = require('../controllers/admin.controller');

router.get('/clans', auth, superadmin, controller.getClans);
router.delete('/clans/:id', auth, superadmin, controller.deleteClan);
router.post('/clans/:id/reset-bears', auth, superadmin, controller.resetClanBears);
router.post('/users/:id/toggle-admin', auth, superadmin, controller.toggleAdmin);

module.exports = router;
