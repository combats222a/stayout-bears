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

const LEVEL_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Table',
    about: 'Опыт, необходимый для повышения уровня персонажа в Stay Out',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Bear Tracker', item: 'https://stayout-bears.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Уровень персонажа', item: 'https://stayout-bears.vercel.app/level' },
    ],
  },
];

const PAGE_TITLE = 'Уровень персонажа и опыт — таблица 0–150 | Bear Tracker Stay Out';
const PAGE_DESCRIPTION =
  'Сколько опыта нужно для каждого уровня персонажа в Stay Out: полная таблица 0–150 без Premium-заглушек — с готовой разницей опыта между уровнями.';
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
export default function LevelPage({ standalone = false }) {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => LEVELS, []);
  const filteredRows = useMemo(() => {
    const q = search.trim();
    if (!q) return rows;
    return rows.filter(row => String(row.level) === q || String(row.level).startsWith(q));
  }, [search, rows]);

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
        <h1 className="promo-hero-title">Уровень <span className="promo-accent">персонажа</span></h1>
        <p className="promo-hero-sub">
          Сколько опыта нужно набрать, чтобы поднять уровень персонажа в Stay Out — без Premium-заглушек,
          сразу с посчитанной разницей между уровнями.
        </p>
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
          <h2 className="level-table-footnote-title">Как считается «Опыт для уровня»</h2>
          <p>
            Официально на вики Stay Out эта колонка скрыта за подпиской Premium начиная со 2 уровня.
            Но её легко посчитать самим: это разница между «Всего опыта» текущего и предыдущего уровня —
            то есть именно то количество очков опыта, которое нужно набрать, чтобы перейти с уровня N&nbsp;−&nbsp;1
            на уровень N. Таблица выше считает эту разницу автоматически для всех 151 уровня персонажа
            (0–150), поэтому доплачивать за неё не нужно.
          </p>
        </div>
      </div>

      {standalone && (
        <p className="level-page-seo-footer">
          Bear Tracker — бесплатный трекер клана Stay Out: респауны белых медведей, расчёт Горы Сияния,
          учёт лута рейдов и персональные таймеры. Раздел «Уровень персонажа» доступен без регистрации —
          загляни также в <a href="/faq">FAQ</a>, если остались вопросы.
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
