import { Router } from 'express';
import { auth } from '../middleware/auth';
import { superadmin } from '../middleware/superadmin';
import controller from '../controllers/admin.controller';

const router = Router();

router.get('/clans', auth, superadmin, controller.getClans);
router.delete('/clans/:id', auth, superadmin, controller.deleteClan);
router.post('/clans/:id/reset-bears', auth, superadmin, controller.resetClanBears);
router.post('/users/:id/toggle-admin', auth, superadmin, controller.toggleAdmin);

export default router;
