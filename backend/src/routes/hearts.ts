import { Router } from 'express';
import { auth } from '../middleware/auth';
import controller from '../controllers/hearts.controller';

const router = Router();

router.get('/', auth, controller.list);
router.post('/participant', auth, controller.create);
router.patch('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);
router.post('/reset', auth, controller.reset);

export default router;
