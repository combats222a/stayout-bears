import { DEFAULT_LOCALE, Locale } from './config';

// Правило из ТЗ:
//   en, en-US, en-GB, en-CA, en-AU, любой en-*  → English
//   ru, ru-RU, любой ru-*                       → Русский
//   любой другой язык (de, fr, pl, uk, ...)     → Русский (fallback)
//
// Намеренно НЕ определяем язык по IP/стране — только по языку браузера.
// navigator.language всегда совпадает с первым элементом navigator.languages,
// когда последний доступен, поэтому опираемся на языки браузера в порядке
// приоритета пользователя и берём первый однозначный результат.
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

  const candidates = (navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  ).filter(Boolean);

  for (const raw of candidates) {
    const primary = raw.toLowerCase().split('-')[0];
    if (primary === 'en') return 'en';
    if (primary === 'ru') return 'ru';
  }

  return DEFAULT_LOCALE;
}
