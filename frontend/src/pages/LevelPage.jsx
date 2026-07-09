import { useEffect, useMemo, useState } from 'react';

// Данные взяты со страницы «Уровень персонажа» базы знаний Stay Out
// (so-wiki.ru), уровни 0-150. На вики столбец «Опыт для уровня» скрыт за
// Premium начиная со 2 уровня — но его несложно посчитать самим: это
// разница между «Всего опыта» текущего и предыдущего уровня.
const TOTAL_EXP_BY_LEVEL = [
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

const LEVELS = TOTAL_EXP_BY_LEVEL.map((total, i) => ({
  level: i,
  total,
  needed: i === 0 ? 0 : total - TOTAL_EXP_BY_LEVEL[i - 1],
}));

const FAQ_ITEMS = [
  {
    q: 'Сколько опыта нужно для 20 уровня в Stay Out?',
    a: 'Воспользуйтесь поиском по таблице выше — введите номер уровня в поле «Найти уровень…», и таблица сразу покажет строку с 20 уровнем: сколько всего опыта нужно накопить и сколько EXP требуется именно на этот уровень. Так же можно найти данные для любого уровня с 0 по 150, например для 30, 50 или 100.',
  },
  {
    q: 'Как рассчитывается опыт для уровня?',
    a: 'Столбец «Опыт для уровня» показывает разницу между общим (накопленным) опытом текущего уровня и общим опытом предыдущего уровня. Проще говоря — сколько EXP нужно набрать дополнительно, уже имея опыт предыдущего уровня, чтобы поднять уровень персонажа на один пункт.',
  },
  {
    q: 'До какого уровня есть таблица опыта Stay Out?',
    a: 'Таблица уровней и опыта содержит все значения с 0 по 150 уровень — это полный диапазон уровней персонажа в игре Stay Out на данный момент, без каких-либо ограничений или платных заглушек.',
  },
  {
    q: 'Где взять калькулятор уровней Stay Out?',
    a: 'Калькулятор находится прямо на этой странице, над таблицей: укажите начальный и конечный уровень (например, с 115 по 142) — и сразу увидите, сколько всего опыта нужно набрать персонажу, чтобы прокачаться между ними. А в самой таблице можно найти данные по каждому отдельному уровню через поиск.',
  },
];

const LEVEL_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Table',
    about: 'Таблица опыта (EXP) и уровней персонажа Stay Out, уровни 0–150',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Bear Tracker', item: 'https://stayout-bears.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Таблица уровней и опыта', item: 'https://stayout-bears.vercel.app/level' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  },
];

const PAGE_TITLE = 'Таблица опыта и уровней Stay Out (0–150) — сколько опыта нужно';
const PAGE_DESCRIPTION =
  'Таблица опыта и уровней Stay Out: сколько EXP нужно для каждого уровня персонажа с 0 по 150, сколько опыта до следующего уровня и общий опыт для любого уровня. Быстрый расчёт прокачки персонажа.';
const PAGE_URL = 'https://stayout-bears.vercel.app/level';

// Мета-теги, которые нужно подменить на время показа этой страницы
// (страница живёт на том же index.html, что и остальные роуты, поэтому
// по умолчанию там теги для главной — их нужно временно переопределить
// и вернуть обратно при уходе со страницы).
const META_OVERRIDES = [
  { tag: 'meta', match: { name: 'description' }, contentAttr: 'content', value: PAGE_DESCRIPTION },
  { tag: 'link', match: { rel: 'canonical' }, contentAttr: 'href', value: PAGE_URL },
  { tag: 'meta', match: { property: 'og:title' }, contentAttr: 'content', value: PAGE_TITLE },
  { tag: 'meta', match: { property: 'og:description' }, contentAttr: 'content', value: PAGE_DESCRIPTION },
  { tag: 'meta', match: { property: 'og:url' }, contentAttr: 'content', value: PAGE_URL },
  { tag: 'meta', match: { name: 'twitter:title' }, contentAttr: 'content', value: PAGE_TITLE },
  { tag: 'meta', match: { name: 'twitter:description' }, contentAttr: 'content', value: PAGE_DESCRIPTION },
];

function nf(n) {
  return n.toLocaleString('ru-RU');
}

// standalone — рендерится как самостоятельная страница (со своей топбаром
// и SEO-метатегами), иначе — как раздел внутри авторизованного приложения
// (там уже есть общий Header).
const MAX_LEVEL = TOTAL_EXP_BY_LEVEL.length - 1;

export default function LevelPage({ standalone = false }) {
  const [search, setSearch] = useState('');
  const [calcFrom, setCalcFrom] = useState('');
  const [calcTo, setCalcTo] = useState('');

  const rows = useMemo(() => LEVELS, []);
  const filteredRows = useMemo(() => {
    const q = search.trim();
    if (!q) return rows;
    return rows.filter(row => String(row.level) === q || String(row.level).startsWith(q));
  }, [search, rows]);

  const calcResult = useMemo(() => {
    if (calcFrom === '' || calcTo === '') return null;
    const from = Number(calcFrom);
    const to = Number(calcTo);
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      return { error: 'Введите целые числа' };
    }
    if (from < 0 || to < 0 || from > MAX_LEVEL || to > MAX_LEVEL) {
      return { error: `Уровни должны быть от 0 до ${MAX_LEVEL}` };
    }
    if (from === to) {
      return { error: 'Выберите два разных уровня' };
    }
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const exp = TOTAL_EXP_BY_LEVEL[hi] - TOTAL_EXP_BY_LEVEL[lo];
    return { from: lo, to: hi, exp, reversed: from > to };
  }, [calcFrom, calcTo]);

  useEffect(() => {
    if (!standalone) return;

    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    // Для каждого тега запоминаем: нашёлся ли он уже в <head> (тогда просто
    // подменяем значение и возвращаем прежнее на выходе) или его пришлось
    // создать с нуля (тогда на выходе просто удаляем).
    const restoreFns = META_OVERRIDES.map(({ tag, match, contentAttr, value }) => {
      const attrSelector = Object.entries(match).map(([k, v]) => `[${k}="${v}"]`).join('');
      let el = document.head.querySelector(`${tag}${attrSelector}`);
      const existed = !!el;
      const prevValue = existed ? el.getAttribute(contentAttr) : null;

      if (!el) {
        el = document.createElement(tag);
        Object.entries(match).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
      }
      el.setAttribute(contentAttr, value);

      return () => {
        if (existed) el.setAttribute(contentAttr, prevValue);
        else el.remove();
      };
    });

    const ldScripts = LEVEL_JSON_LD.map(obj => {
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
  }, [standalone]);

  const content = (
    <div className="page level-page">
      <div className="promo-hero">
        <div className="promo-hero-icon">📈</div>
        <h1 className="promo-hero-title">Таблица опыта персонажа <span className="promo-accent">Stay Out</span></h1>
        <p className="promo-hero-sub">
          Здесь можно узнать, сколько опыта (EXP) требуется для каждого уровня персонажа с 0 по 150,
          сколько опыта нужно до следующего уровня и общий опыт для достижения любого уровня.
          Подходит для быстрого расчёта прокачки персонажа.
        </p>
      </div>

      <div className="card level-calc-card">
        <h2 className="level-table-footnote-title level-calc-title">
          Калькулятор опыта между уровнями
        </h2>
        <p className="level-calc-sub">
          Укажите начальный и конечный уровень — калькулятор посчитает, сколько всего опыта (EXP)
          нужно набрать персонажу, чтобы прокачаться с одного уровня до другого.
        </p>
        <div className="level-calc-row">
          <label className="level-calc-field">
            <span className="level-calc-label">С уровня</span>
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
            <span className="level-calc-label">До уровня</span>
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

        {calcResult && calcResult.error && (
          <div className="level-calc-result level-calc-error">{calcResult.error}</div>
        )}

        {calcResult && !calcResult.error && (
          <div className="level-calc-result">
            <span className="level-calc-result-label">
              Опыт с {calcResult.from} до {calcResult.to} уровня:
            </span>
            <span className="level-calc-result-value">{nf(calcResult.exp)} EXP</span>
            {calcResult.reversed && (
              <span className="level-calc-note">
                (уровни переставлены местами — расчёт всегда идёт от меньшего к большему)
              </span>
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
            placeholder="Найти уровень…"
            className="level-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="level-table-count">
            {filteredRows.length === rows.length ? `Все уровни: 0–${rows.length - 1}` : `Найдено: ${filteredRows.length}`}
          </span>
        </div>

        <div className="level-table-wrap">
          <table className="level-table">
            <thead>
              <tr>
                <th>Уровень</th>
                <th>Всего опыта</th>
                <th>Опыт для уровня</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.level}>
                  <td>
                    <span className="level-badge">{row.level}</span>
                  </td>
                  <td className="level-total">{nf(row.total)}</td>
                  <td className="level-needed">
                    {row.level === 0 ? '—' : `+${nf(row.needed)}`}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="level-table-empty">Уровень не найден</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="level-table-footnote">
          <h2 className="level-table-footnote-title">Откуда цифры в столбце «Опыт для уровня»</h2>
          <p>
            Столбец считается по простой формуле: берём «Всего опыта» нужного уровня и вычитаем «Всего опыта»
            уровня, который был перед ним. Получившееся число и есть тот самый недостающий опыт — сколько
            очков должно накопиться сверху, чтобы счётчик уровня щёлкнул на следующий. Ничего скрывать за
            платной подпиской не пришлось: расчёт идёт прямо в браузере по всем 151 значению (уровни 0–150),
            обновится сам, если появятся более свежие цифры.
          </p>
        </div>
      </div>

      <div className="card faq-list level-faq">
        <h2 className="level-table-footnote-title">Частые вопросы об опыте и уровнях Stay Out</h2>
        {FAQ_ITEMS.map(item => (
          <div className="faq-item" key={item.q}>
            <h3 className="faq-question">{item.q}</h3>
            <p className="faq-answer">{item.a}</p>
          </div>
        ))}
      </div>

      {standalone && (
        <p className="level-page-seo-footer">
          Это была таблица уровней Stay Out с полным расчётом опыта (EXP) по каждому уровню — от подготовки
          к 20-му уровню до прокачки персонажа на 150-й. Bear Tracker — ещё и бесплатный трекер клана Stay Out:
          респауны белых медведей, расчёт Горы Сияния, учёт лута рейдов и персональные таймеры. Раздел с таблицей
          опыта доступен без регистрации — загляни также в <a href="/faq">FAQ</a>, если остались вопросы.
        </p>
      )}
    </div>
  );

  if (!standalone) return content;

  return (
    <div className="public-landing">
      <div className="public-landing-topbar">
        <a className="public-landing-brand" href="/" style={{ textDecoration: 'none' }}>
          <span className="public-landing-logo">🐻‍❄️</span>
          <span className="public-landing-name">Bear Tracker</span>
        </a>
        <a className="btn btn-ghost btn-sm" href="/">← На главную</a>
      </div>

      <div className="promo-page">
        {content}

        <div className="promo-footer">
          Хочешь ещё и отслеживать медведей, Гору Сияния и таймеры клана? Загляни на главную и зарегистрируйся —
          это бесплатно.
        </div>
      </div>
    </div>
  );
}
