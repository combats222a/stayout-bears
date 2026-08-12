import { useEffect, useMemo } from 'react';
import { useLocaleDict, useI18n } from '../../i18n';
import ruFaq from '../../i18n/locales/ru/faq';
import enFaq from '../../i18n/locales/en/faq';

const PAGE_URL = 'https://stayout-bears.vercel.app/faq';

function setMeta(selector: string, attr: string, value: string): Element {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    if (selector.includes('name="description"')) el.setAttribute('name', 'description');
    if (selector.includes('rel="canonical"')) el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
  return el;
}

export default function FaqPage() {
  const { locale } = useI18n();
  const c = useLocaleDict(ruFaq, enFaq);

  // JSON-LD пересчитывается на каждый locale — поисковик должен видеть
  // структурированные данные на том же языке, что и видимый текст страницы.
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }), [c]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = c.pageTitle;

    const descEl = setMeta('meta[name="description"]', 'content', c.pageDescription);
    const canonicalEl = setMeta('link[rel="canonical"]', 'href', PAGE_URL);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(script);
      // Оставляем description/canonical как были на моменте выхода —
      // при полном переходе на другой роут страница всё равно перезагрузится.
      void descEl; void canonicalEl;
    };
  }, [c, jsonLd, locale]);

  // Своей шапки у страницы больше нет — она встраивается внутрь App
  // (см. main.jsx / App.jsx) и получает тот же общий <Header>, что и все
  // остальные разделы, у авторизованных и у гостей одинаково.
  return (
    <div className="page promo-page">
      <div className="promo-hero">
        <div className="promo-hero-icon">❓</div>
        <h1 className="promo-hero-title">{c.heroTitlePrefix}<span className="promo-accent">{c.heroTitleAccent}</span></h1>
        <p className="promo-hero-sub">{c.heroSubtitle}</p>
      </div>

      <div className="card faq-list">
        {c.items.map(item => (
          <div className="faq-item" key={item.q}>
            <h2 className="faq-question">{item.q}</h2>
            <p className="faq-answer">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="promo-footer">{c.footer}</div>
    </div>
  );
}
