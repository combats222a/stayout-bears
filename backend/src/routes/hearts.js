const router = require('express').Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/hearts.controller');

router.get('/', auth, controller.list);
router.post('/participant', auth, controller.create);
router.patch('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);
router.post('/reset', auth, controller.reset);

module.exports = router;
