const router = require('express').Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/clan.controller');

router.post('/create', auth, controller.create);
router.post('/join', auth, controller.join);
router.post('/leave', auth, controller.leave);
router.get('/me', auth, controller.me);
router.post('/kick/:userId', auth, controller.kick);
router.post('/ban/:userId', auth, controller.ban);
router.post('/unban/:userId', auth, controller.unban);
router.post('/transfer/:userId', auth, controller.transfer);
router.post('/deputy/:userId', auth, controller.deputy);
router.post('/rename', auth, controller.rename);
router.post('/refresh-code', auth, controller.refreshCode);

module.exports = router;
