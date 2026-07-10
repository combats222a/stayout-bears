import { useEffect } from 'react';

const FAQ_ITEMS = [
  {
    q: 'Как пользоваться Bear Tracker?',
    a: 'Bear Tracker — это бесплатный онлайн-трекер для клана Stay Out, который работает прямо в браузере без установки. Зарегистрируйся или войди под ником клана, и тебе станут доступны разделы «Медведи» (обратный отсчёт до респауна белых медведей), «Сияние» (расчёт времени открытия Горы Сияния), «Учёт лута» (распределение добычи рейдовых боссов между участниками) и «Таймеры» (персональные обратные отсчёты под любую задачу). Все данные синхронизируются в реальном времени между всеми участниками клана — если кто-то отметил респаун медведя, остальные видят обновление мгновенно.',
  },
  {
    q: 'Что такое Гора Сияния?',
    a: 'Гора Сияния — особая локация в Stay Out с ускоренным течением времени: одна игровая минута там равна примерно 8 минутам 45 секундам реального времени. Явление «Сияние» открывается четыре раза в игровые сутки — в 00:00, 06:00, 12:00 и 18:00 по игровому времени — и держится один игровой час. Пересчитывать игровые часы в реальные вручную неудобно, поэтому Bear Tracker делает это автоматически и присылает звуковое уведомление ровно в момент начала каждого Сияния, чтобы клан успел подготовиться заранее.',
  },
  {
    q: 'Как работают таймеры?',
    a: 'В разделе «Таймеры» можно завести собственный обратный отсчёт под любую повторяющуюся задачу: перезарядку способности, время до следующего рейда, откат крафта или дедлайн клановой активности. Достаточно указать название и длительность — от одной минуты до нескольких суток, — и трекер начнёт считать оставшееся время. По готовности таймер подаёт звуковой сигнал, даже если вкладка браузера свёрнута или ты переключился на игру. Таймеры для медведей и Горы Сияния работают по такому же принципу, но настроены автоматически под игровые механики Stay Out.',
  },
  {
    q: 'Как активировать промокод?',
    a: 'Промокод Stay Out вводится на экране выбора персонажа: нажми кнопку «Ввести промокод», введи код и подтверди активацию — набор появится в Хранилище аккаунта. Дальше в безопасной зоне открой инвентарь (клавиша I), в левом верхнем углу нажми на иконку коробки, чтобы открыть Хранилище, и перетащи полученный набор в инвентарь. После этого нажми правой кнопкой мыши по подарочному набору и выбери «Использовать», а затем таким же образом активируй подарочную премиальную подписку — она даст 7 дней премиума со всеми бонусами. Актуальные промокоды и подробный список бонусов смотри на странице «Промокод».',
  },
];

const FAQ_JSON_LD = {
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
};

const PAGE_TITLE = 'FAQ — вопросы и ответы о Bear Tracker | Stay Out';
const PAGE_DESCRIPTION =
  'Ответы на частые вопросы о Bear Tracker: как пользоваться трекером клана Stay Out, что такое Гора Сияния, как работают таймеры и как активировать промокод.';
const PAGE_URL = 'https://stayout-bears.vercel.app/faq';

export default function FaqPage() {
  useEffect(() => {
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

    const descEl = setMeta('meta[name="description"]', 'content', PAGE_DESCRIPTION);
    const canonicalEl = setMeta('link[rel="canonical"]', 'href', PAGE_URL);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(FAQ_JSON_LD);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(script);
      // Оставляем description/canonical как были на моменте выхода —
      // при полном переходе на другой роут страница всё равно перезагрузится.
      void descEl; void canonicalEl;
    };
  }, []);

  // Своей шапки у страницы больше нет — она встраивается внутрь App
  // (см. main.jsx / App.jsx) и получает тот же общий <Header>, что и все
  // остальные разделы, у авторизованных и у гостей одинаково.
  return (
    <div className="page promo-page">
      <div className="promo-hero">
        <div className="promo-hero-icon">❓</div>
        <h1 className="promo-hero-title">Часто задаваемые <span className="promo-accent">вопросы</span></h1>
        <p className="promo-hero-sub">
          Всё, что нужно знать о Bear Tracker — трекере клана Stay Out
        </p>
      </div>

      <div className="card faq-list">
        {FAQ_ITEMS.map(item => (
          <div className="faq-item" key={item.q}>
            <h2 className="faq-question">{item.q}</h2>
            <p className="faq-answer">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="promo-footer">
        Не нашёл ответ? Загляни в раздел «Промокод» на главной странице или зарегистрируйся, чтобы
        пользоваться трекером медведей, Горы Сияния и таймеров.
      </div>
    </div>
  );
}
