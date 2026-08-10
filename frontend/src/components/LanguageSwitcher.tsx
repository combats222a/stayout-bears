import { SUPPORTED_LOCALES, LOCALE_LABELS, useI18n, Locale } from '../i18n';

// Явная карта locale → ключ перевода вместо шаблонной строки
// `language.${code}` — так TranslationKey остаётся точным литеральным
// объединением без риска, что TS в каком-то месте молча расширит его до
// общего `string`.
const LOCALE_NAME_KEY = {
  ru: 'language.ru',
  en: 'language.en',
} as const satisfies Record<Locale, string>;

// Компактный RU|EN переключатель для правой части Header (десктоп) и для
// панели разделов (мобильный гамбургер-меню) — используется в обоих
// местах, поэтому принимает необязательный className для точечной
// подгонки отступов под конкретное место без дублирования разметки.
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={`lang-switcher ${className}`} role="group" aria-label={t('language.switcherLabel')}>
      {SUPPORTED_LOCALES.map(code => (
        <button
          key={code}
          type="button"
          className={`lang-switcher-btn ${locale === code ? 'active' : ''}`}
          aria-pressed={locale === code}
          aria-label={t(LOCALE_NAME_KEY[code])}
          onClick={() => setLocale(code)}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
