import { useEffect, useMemo } from 'react';

// Данные взяты со страницы «Уровень персонажа» базы знаний Stay Out
// (so-wiki.ru). На вики столбец «Опыт для уровня» скрыт за Premium
// начиная со 2 уровня — но его несложно посчитать самим: это разница
// между «Всего опыта» текущего и предыдущего уровня. Как только появятся
// данные по следующим уровням — просто дополните массив ниже.
const TOTAL_EXP_BY_LEVEL = [
  0,
  950,
  2057,
  3394,
  5049,
  7125,
  9744,
];

const LEVELS = TOTAL_EXP_BY_LEVEL.map((total, i) => ({
  level: i,
  total,
  needed: i === 0 ? 0 : total - TOTAL_EXP_BY_LEVEL[i - 1],
}));

const LEVEL_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Table',
  about: 'Опыт, необходимый для повышения уровня персонажа в Stay Out',
};

const PAGE_TITLE = 'Уровень персонажа и опыт — таблица | Bear Tracker Stay Out';
const PAGE_DESCRIPTION =
  'Таблица уровней персонажа Stay Out: всего опыта и опыт, необходимый для перехода на следующий уровень — посчитано без Premium-заглушек.';
const PAGE_URL = 'https://stayout-bears.vercel.app/level';

function nf(n) {
  return n.toLocaleString('ru-RU');
}

// standalone — рендерится как самостоятельная страница (со своей топбаром
// и SEO-метатегами), иначе — как раздел внутри авторизованного приложения
// (там уже есть общий Header).
export default function LevelPage({ standalone = false }) {
  const rows = useMemo(() => LEVELS, []);

  useEffect(() => {
    if (!standalone) return;

    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    const setMeta = (selector, attr, value) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
        if (selector.includes('name="description"')) el.setAttribute('name', 'description');
        if (selector.includes('rel="canonical"')) el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
      return el;
    };

    setMeta('meta[name="description"]', 'content', PAGE_DESCRIPTION);
    setMeta('link[rel="canonical"]', 'href', PAGE_URL);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(LEVEL_JSON_LD);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(script);
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
              {rows.map(row => (
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
            </tbody>
          </table>
        </div>

        <div className="level-table-footnote">
          «Опыт для уровня» — это разница между «Всего опыта» текущего и предыдущего уровня
          (сколько нужно набрать, чтобы перейти именно на этот уровень). Данные по уровням 7+ пока не
          опубликованы — добавим таблицу по мере появления информации.
        </div>
      </div>
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
