import { Router } from 'express';
import { auth } from '../middleware/auth';
import controller from '../controllers/timers.controller';

const router = Router();

router.get('/', auth, controller.list);
router.post('/', auth, controller.create);
router.patch('/:id', auth, controller.update);
router.post('/reorder', auth, controller.reorder);
router.post('/:id/reset', auth, controller.reset);
router.post('/:id/clear', auth, controller.clear);
router.delete('/:id', auth, controller.remove);

export default router;
