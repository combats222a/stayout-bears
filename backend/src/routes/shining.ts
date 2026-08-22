import { Router } from 'express';
import { auth } from '../middleware/auth';
import controller from '../controllers/shining.controller';

const router = Router();

router.get('/', auth, controller.get);
router.post('/set', auth, controller.set);

export default router;
