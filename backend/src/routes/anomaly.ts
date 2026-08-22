import { Router } from 'express';
import { auth } from '../middleware/auth';
import controller from '../controllers/anomaly.controller';

const router = Router();

// Аномальные прорывы / Ледяная жара — в отличие от Сияния (одна запись
// на клан), здесь одна запись на АККАУНТ: видит и настраивает только
// сам игрок, независимо от того, в каком он клане.
router.get('/', auth, controller.get);
router.post('/set', auth, controller.set);

export default router;
