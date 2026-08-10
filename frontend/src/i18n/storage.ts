import { isSupportedLocale, Locale, LOCALE_STORAGE_KEY } from './config';

// Хранит ТОЛЬКО осознанный ручной выбор пользователя. Автоопределение по
// языку браузера никогда сюда не пишет — иначе следующий визит начал бы
// читать "сохранённый" язык, который на самом деле никто не выбирал, и
// пункт ТЗ "ручной выбор нельзя переопределить" перестал бы что-либо значить.
//
// Нет SSR (Vite CSR SPA) — поэтому localStorage тут безопасен: не ломает
// серверный рендер, потому что сервера нет. Ранний inline-скрипт в
// index.html читает этот же ключ синхронно ДО первого рендера React, чтобы
// не было мигания "не тот язык → правильный язык" на первом кадре.
export function getSavedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isSupportedLocale(raw) ? raw : null;
  } catch {
    // localStorage может быть недоступен (приватный режим, ограничения
    // браузера) — тогда просто работаем без сохранения, не роняя сайт.
    return null;
  }
}

export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Игнорируем — сохранение языка не должно быть блокирующей операцией.
  }
}
