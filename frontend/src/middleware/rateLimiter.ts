import rateLimit from 'express-rate-limit';

// Защита от повторных регистраций с одного IP.
// 1 регистрация за 168 часов (7 дней) на IP.
// Если бэкенд стоит за реверс-прокси (Vercel/Railway/Render/Nginx и т.п.),
// для корректного определения IP нужно app.set('trust proxy', ...) в index.ts —
// иначе все запросы будут видны с одного IP прокси, и лимит будет общим на всех.
export const registerRateLimiter = rateLimit({
  windowMs: 168 * 60 * 60 * 1000, // 168 часов
  limit: 1,
  standardHeaders: true, // отдаёт RateLimit-* заголовки клиенту
  legacyHeaders: false,
  message: { error: 'Слишком много попыток регистрации с этого IP. Попробуйте позже.' },
  // По умолчанию express-rate-limit ключует по req.ip — этого достаточно,
  // отдельный keyGenerator не нужен.
});
