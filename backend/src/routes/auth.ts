import { Router } from 'express';
import { auth } from '../middleware/auth';
import controller from '../controllers/auth.controller';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);
router.put('/profile', auth, controller.updateProfile);
router.delete('/account', auth, controller.deleteAccount);

export default router;
