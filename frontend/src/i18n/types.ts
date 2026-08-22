// Утилитный тип: берёт форму объекта переводов (обычно ru/*) и требует от
// другого языка (en/*) точно такой же набор ключей, где каждое значение —
// строка. Так любой файл en/*.ts не может ни забыть ключ, ни добавить
// лишний, ни случайно оставить не-строковое значение — ошибка всплывёт
// на этапе `tsc`/build, а не в рантайме на реальном сайте.
export type DeepValuesToString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepValuesToString<T[K]>;
};

// Строит объединение всех "путей" вида "common.loading" | "navigation.faq"
// по вложенному объекту переводов — это и есть множество валидных ключей
// для функции t(). any-типов не используется: рекурсия работает по
// реальной форме объекта ru/index.ts.
export type TranslationKeyPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : TranslationKeyPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
