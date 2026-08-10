import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { Locale } from './config';
import { detectBrowserLocale } from './detector';
import { getSavedLocale, saveLocale } from './storage';
import { resolveTranslation, TranslationKey } from './translations';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Приоритет источника языка при первом рендере (см. ТЗ, раздел 1):
//   1. сохранённый ручной выбор пользователя;
//   2. язык браузера;
//   3. fallback ru.
// Это единственное место, где применяется вся эта логика — читается
// синхронно ДО первого рендера (в инициализаторе useState), поэтому в CSR
// первый же кадр уже отрисовывается на правильном языке, без "мигания".
function resolveInitialLocale(): Locale {
  return getSavedLocale() ?? detectBrowserLocale();
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  // После ручного переключения — сохраняем выбор. С этого момента
  // resolveInitialLocale() при следующей загрузке всегда найдёт сохранённый
  // locale раньше, чем дойдёт до определения по языку браузера, то есть
  // автоопределение больше никогда не переопределит этот выбор.
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
  }, []);

  const t = useCallback((key: TranslationKey) => resolveTranslation(locale, key), [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n() должен использоваться внутри <I18nProvider>');
  }
  return ctx;
}

// Узкий хук для компонентов, которым нужна только функция перевода — чуть
// удобнее в импорте и явно сигнализирует намерение в коде компонента.
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
