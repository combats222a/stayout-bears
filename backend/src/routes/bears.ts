import { Router } from 'express';
import { auth } from '../middleware/auth';
import { makeController } from '../controllers/tracker.controller';
import { BEARS_CONFIG } from '../services/tracker.config';

const router = Router();
const controller = makeController(BEARS_CONFIG);

// POST /bears/:index/kill
// body: { killed_at? } — если не передан, используется текущее время (кнопка "Сейчас")
// если передан — кнопка "Исчез" (медведь пропал ~5 мин назад)
router.post('/:index/kill', auth, controller.kill);

// POST /bears/:index/reset
router.post('/:index/reset', auth, controller.reset);

export default router;
