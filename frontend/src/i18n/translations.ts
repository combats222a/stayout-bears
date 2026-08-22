import { Locale } from './config';
import ru from './locales/ru';
import en from './locales/en';
import type { DeepValuesToString, TranslationKeyPaths } from './types';

// Форма дерева переводов (см. types.ts) — и ru, и en структурно совпадают
// с ней, но у ru значения выводятся как литеральные строки, а у en —
// принудительно как обычный string (см. DeepValuesToString в locales/en/*).
// Поэтому в реестре ресурсов используем именно этот общий тип, а не
// `typeof ru`, иначе TS считает более широкий тип en несовместимым с
// более узким литеральным типом ru.
type TranslationTree = DeepValuesToString<typeof ru>;

export const resources: Record<Locale, TranslationTree> = { ru, en };

// Объединение всех валидных ключей вида "common.loading" | "language.ru" —
// выводится из реальной структуры ru/index.ts, поэтому опечатка в ключе или
// использование несуществующего ключа — ошибка типов, а не немая надпись
// вроде "common.missingKey" в интерфейсе.
export type TranslationKey = TranslationKeyPaths<typeof ru>;

// Достаёт значение по пути "a.b.c" без `any`: по конструкции TranslationKey
// путь всегда указывает на строковый лист дерева переводов, поэтому cast
// в конце сужает unknown к string, а не обходит проверку типов ключа.
export function resolveTranslation(locale: Locale, key: TranslationKey): string {
  const path = key.split('.');
  let node: unknown = resources[locale];
  for (const segment of path) {
    if (node && typeof node === 'object' && segment in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[segment];
    } else {
      node = undefined;
      break;
    }
  }
  if (typeof node === 'string') return node;
  // Практически недостижимо при валидном TranslationKey (форма ru/en
  // синхронизирована типами), но не роняем интерфейс, если такое всё же
  // произойдёт — возвращаем сам ключ, чтобы проблема была заметна в UI.
  return key;
}
