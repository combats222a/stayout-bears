// Центральная точка правды для списка поддерживаемых языков. Чтобы добавить
// новый язык в будущем — добавь его код сюда, в SUPPORTED_LOCALES, и создай
// src/i18n/locales/<code>/ с тем же набором файлов, что у ru/en (см. README
// рядом или просто скопируй структуру ru/).

export const SUPPORTED_LOCALES = ['ru', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// Единственное имя ключа хранения locale во всём проекте — используется и
// в localStorage, и (если понадобится) в других местах. Не заводить рядом
// ещё "language"/"lang"/"userLanguage" и т.п.
export const LOCALE_STORAGE_KEY = 'locale';

// Человекочитаемые подписи языков — используются в переключателе и не
// зависят от текущего выбранного locale (RU показывается как "RU" что на
// русском, что на английском интерфейсе).
export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'RU',
  en: 'EN',
};
