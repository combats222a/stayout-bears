import { Router } from 'express';
import { auth } from '../middleware/auth';
import { registerRateLimiter } from '../middleware/rateLimiter';
import controller from '../controllers/auth.controller';

const router = Router();

// 1 регистрация за 168 часов с одного IP (см. middleware/rateLimiter.ts)
router.post('/register', registerRateLimiter, controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);
router.put('/profile', auth, controller.updateProfile);
router.delete('/account', auth, controller.deleteAccount);

export default router;
