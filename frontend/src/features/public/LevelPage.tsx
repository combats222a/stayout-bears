import { useEffect, useMemo, useState } from 'react';
import { useLocaleDict, useI18n } from '../../i18n';
import ruLevel from '../../i18n/locales/ru/level';
import enLevel from '../../i18n/locales/en/level';

// Данные взяты со страницы «Уровень персонажа» базы знаний Stay Out
// (so-wiki.ru), уровни 0-150. На вики столбец «Опыт для уровня» скрыт за
// Premium начиная со 2 уровня — но его несложно посчитать самим: это
// разница между «Всего опыта» текущего и предыдущего уровня.
const TOTAL_EXP_BY_LEVEL: number[] = [
  0, 950, 2057, 3394, 5049, 7125, 9744, 13044, 17181, 22329,
  28681, 36450, 45866, 57181, 70665, 86611, 105331, 127158, 152446, 181572,
  214934, 252953, 296071, 344753, 399487, 460784, 529178, 605228, 689515, 782644,
  885245, 997972, 1121504, 1256544, 1403819, 1564084, 1738116, 1926720, 2130724, 2350985,
  2588383, 2843826, 3118247, 3412607, 3727892, 4065115, 4425317, 4809564, 5218952, 5654602,
  6117663, 6609312, 7130754, 7683221, 8267974, 8886301, 9539519, 10228974, 10956039, 11722117,
  12528639, 13377066, 14268887, 15205620, 16188813, 17220043, 18300916, 19433069, 20618168, 21857909,
  23154018, 24508250, 25922392, 27398260, 28937701, 30542592, 32214841, 33956387, 35769199, 37655277,
  39616653, 41655390, 43773581, 45973352, 48256859, 50626290, 53083865, 55631836, 58272485, 61008128,
  63841112, 66773816, 69808652, 72948064, 76194528, 79550552, 83018678, 86601479, 90301562, 94121566,
  98064163, 102132059, 106327992, 110654733, 115115088, 119711894, 124448023, 129326380, 134349903, 139521564,
  144844370, 150321360, 155955608, 161750222, 167708343, 173833148, 180127846, 186595682, 193239935, 200063917,
  207070977, 214264497, 221647894, 229224620, 236998161, 244972039, 253149810, 261535066, 270131434, 278942576,
  287972188, 297224003, 306701789, 316409350, 326350524, 336529186, 346949246, 357614650, 368529380, 379697454,
  391122925, 402809883, 414762454, 426984800, 439481119, 452255646, 465312652, 478656444, 492291366, 506221798,
  520452157,
];

interface LevelRow {
  level: number;
  total: number;
  needed: number;
}

const LEVELS: LevelRow[] = TOTAL_EXP_BY_LEVEL.map((total, i) => ({
  level: i,
  total,
  needed: i === 0 ? 0 : total - TOTAL_EXP_BY_LEVEL[i - 1],
}));

const PAGE_URL = 'https://stayout-bears.vercel.app/level';
const HOME_URL = 'https://stayout-bears.vercel.app/';

interface MetaOverride {
  tag: string;
  match: Record<string, string>;
  contentAttr: string;
  value: string;
}

function nf(n: number, locale: string): string {
  return n.toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU');
}

// standalone — рендерится как самостоятельная страница (со своей топбаром
// и SEO-метатегами), иначе — как раздел внутри авторизованного приложения
// (там уже есть общий Header).
const MAX_LEVEL = TOTAL_EXP_BY_LEVEL.length - 1;

type CalcResult =
  | null
  | { ok: false; error: string }
  | { ok: true; from: number; to: number; exp: number; reversed: boolean };

export default function LevelPage({ standalone = false }: { standalone?: boolean }) {
  const { locale } = useI18n();
  const c = useLocaleDict(ruLevel, enLevel);
  const [search, setSearch] = useState('');
  const [calcFrom, setCalcFrom] = useState('');
  const [calcTo, setCalcTo] = useState('');

  const rows = useMemo(() => LEVELS, []);
  const filteredRows = useMemo(() => {
    const q = search.trim();
    if (!q) return rows;
    return rows.filter(row => String(row.level) === q || String(row.level).startsWith(q));
  }, [search, rows]);

  const calcResult: CalcResult = useMemo(() => {
    if (calcFrom === '' || calcTo === '') return null;
    const from = Number(calcFrom);
    const to = Number(calcTo);
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      return { ok: false, error: c.calcErrorInteger };
    }
    if (from < 0 || to < 0 || from > MAX_LEVEL || to > MAX_LEVEL) {
      return { ok: false, error: c.calcErrorRange(MAX_LEVEL) };
    }
    if (from === to) {
      return { ok: false, error: c.calcErrorSameLevel };
    }
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const exp = TOTAL_EXP_BY_LEVEL[hi] - TOTAL_EXP_BY_LEVEL[lo];
    return { ok: true, from: lo, to: hi, exp, reversed: from > to };
  }, [calcFrom, calcTo, c]);

  const jsonLd = useMemo(() => [
    {
      '@context': 'https://schema.org',
      '@type': 'Table',
      about: c.tableAbout,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Bear Tracker', item: HOME_URL },
        { '@type': 'ListItem', position: 2, name: c.breadcrumbName, item: PAGE_URL },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faqItems.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ], [c]);

  // Мета-теги, которые нужно подменить на время показа этой страницы
  // (страница живёт на том же index.html, что и остальные роуты, поэтому
  // по умолчанию там теги для главной — их нужно временно переопределить
  // и вернуть обратно при уходе со страницы).
  const metaOverrides: MetaOverride[] = useMemo<MetaOverride[]>(() => {
    const mo = (tag: string, match: Record<string, string>, contentAttr: string, value: string): MetaOverride =>
      ({ tag, match, contentAttr, value });
    return [
      mo('meta', { name: 'description' }, 'content', c.pageDescription),
      mo('link', { rel: 'canonical' }, 'href', PAGE_URL),
      mo('meta', { property: 'og:title' }, 'content', c.pageTitle),
      mo('meta', { property: 'og:description' }, 'content', c.pageDescription),
      mo('meta', { property: 'og:url' }, 'content', PAGE_URL),
      mo('meta', { name: 'twitter:title' }, 'content', c.pageTitle),
      mo('meta', { name: 'twitter:description' }, 'content', c.pageDescription),
    ];
  }, [c]);

  useEffect(() => {
    if (!standalone) return;

    const prevTitle = document.title;
    document.title = c.pageTitle;

    // Для каждого тега запоминаем: нашёлся ли он уже в <head> (тогда просто
    // подменяем значение и возвращаем прежнее на выходе) или его пришлось
    // создать с нуля (тогда на выходе просто удаляем).
    const restoreFns = metaOverrides.map(({ tag, match, contentAttr, value }) => {
      const attrSelector = Object.entries(match).map(([k, v]) => `[${k}="${v}"]`).join('');
      let el = document.head.querySelector(`${tag}${attrSelector}`);
      const existed = !!el;
      const prevValue = existed ? el!.getAttribute(contentAttr) : null;

      if (!el) {
        el = document.createElement(tag);
        Object.entries(match).forEach(([k, v]) => el!.setAttribute(k, v));
        document.head.appendChild(el);
      }
      el.setAttribute(contentAttr, value);

      return () => {
        if (existed) el!.setAttribute(contentAttr, prevValue as string);
        else el!.remove();
      };
    });

    const ldScripts = jsonLd.map(obj => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(obj);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      document.title = prevTitle;
      restoreFns.forEach(fn => fn());
      ldScripts.forEach(s => document.head.removeChild(s));
    };
  }, [standalone, c, jsonLd, metaOverrides]);

  const content = (
    <div className="page level-page">
      <div className="promo-hero">
        <div className="promo-hero-icon">📈</div>
        <h1 className="promo-hero-title">{c.heroTitlePrefix}<span className="promo-accent">{c.heroTitleAccent}</span></h1>
        <p className="promo-hero-sub">{c.heroSubtitle}</p>
      </div>

      <div className="card level-calc-card">
        <h2 className="level-table-footnote-title level-calc-title">{c.calcTitle}</h2>
        <p className="level-calc-sub">{c.calcSub1}</p>
        <p className="level-calc-sub">{c.calcSub2}</p>
        <div className="level-calc-row">
          <label className="level-calc-field">
            <span className="level-calc-label">{c.calcFromLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={MAX_LEVEL}
              placeholder="115"
              className="level-search-input level-calc-input"
              value={calcFrom}
              onChange={e => setCalcFrom(e.target.value)}
            />
          </label>
          <span className="level-calc-arrow">→</span>
          <label className="level-calc-field">
            <span className="level-calc-label">{c.calcToLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={MAX_LEVEL}
              placeholder="142"
              className="level-search-input level-calc-input"
              value={calcTo}
              onChange={e => setCalcTo(e.target.value)}
            />
          </label>
        </div>

        {calcResult && !calcResult.ok && (
          <div className="level-calc-result level-calc-error">{calcResult.error}</div>
        )}

        {calcResult && calcResult.ok && (
          <div className="level-calc-result">
            <span className="level-calc-result-label">{c.calcResultLabel(calcResult.from, calcResult.to)}</span>
            <span className="level-calc-result-value">{nf(calcResult.exp, locale)} EXP</span>
            <p className="level-calc-phrase">{c.calcPhrase(calcResult.from, calcResult.to, nf(calcResult.exp, locale))}</p>
            {calcResult.reversed && (
              <span className="level-calc-note">{c.calcReversedNote}</span>
            )}
          </div>
        )}
      </div>

      <div className="card level-table-card">
        <div className="level-table-toolbar">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="150"
            placeholder={c.searchPlaceholder}
            className="level-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="level-table-count">
            {filteredRows.length === rows.length ? c.allLevels(rows.length - 1) : c.found(filteredRows.length)}
          </span>
        </div>

        <div className="level-table-wrap">
          <table className="level-table">
            <thead>
              <tr>
                <th>{c.tableHeadLevel}</th>
                <th>{c.tableHeadTotal}</th>
                <th>{c.tableHeadNeeded}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.level}>
                  <td>
                    <span className="level-badge">{row.level}</span>
                  </td>
                  <td className="level-total">{nf(row.total, locale)}</td>
                  <td className="level-needed">
                    {row.level === 0 ? '—' : `+${nf(row.needed, locale)}`}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="level-table-empty">{c.levelNotFound}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="level-table-footnote">
          <h2 className="level-table-footnote-title">{c.footnoteTitle}</h2>
          <p>{c.footnoteText}</p>
        </div>
      </div>

      <div className="card faq-list level-faq">
        <h2 className="level-table-footnote-title">{c.faqSectionTitle}</h2>
        {c.faqItems.map(item => (
          <div className="faq-item" key={item.q}>
            <h3 className="faq-question">{item.q}</h3>
            <p className="faq-answer">{item.a}</p>
          </div>
        ))}
      </div>

      {standalone && (
        <p className="level-page-seo-footer">
          {c.standaloneSeoFooter}{' '}
          <a href="/faq">{c.faqLinkLabel}</a>.
        </p>
      )}
    </div>
  );

  if (!standalone) return content;

  // Своей шапки здесь больше нет — как и на /faq, гостю показывается общий
  // <Header> (см. App.jsx). Раньше здесь рисовался отдельный урезанный
  // топбар («лого + На главную»), из-за чего шапка на /level для гостя
  // не совпадала с шапкой на остальных страницах — тот же баг, что был на /faq.
  return (
    <div className="promo-page">
      {content}
      <div className="promo-footer">{c.standaloneFooterText}</div>
    </div>
  );
}
