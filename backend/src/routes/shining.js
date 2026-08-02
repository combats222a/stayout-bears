const router = require('express').Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/shining.controller');

router.get('/', auth, controller.get);
router.post('/set', auth, controller.set);

module.exports = router;
