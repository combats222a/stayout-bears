import { Router } from 'express';
import { auth } from '../middleware/auth';
import { makeController } from '../controllers/tracker.controller';
import { DRAUGS_CONFIG } from '../services/tracker.config';

const router = Router();
const controller = makeController(DRAUGS_CONFIG);

// POST /draugs/:index/kill
// body: { killed_at? } — если не передан, используется текущее время (кнопка "Сейчас")
// если передан — кнопка "Исчез" (драуг пропал ~5 мин назад)
router.post('/:index/kill', auth, controller.kill);

// POST /draugs/:index/reset
router.post('/:index/reset', auth, controller.reset);

export default router;
