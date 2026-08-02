const router = require('express').Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/timers.controller');

router.get('/', auth, controller.list);
router.post('/', auth, controller.create);
router.patch('/:id', auth, controller.update);
router.post('/reorder', auth, controller.reorder);
router.post('/:id/reset', auth, controller.reset);
router.post('/:id/clear', auth, controller.clear);
router.delete('/:id', auth, controller.remove);

module.exports = router;
