import { useState } from 'react';
import { STEAM_URL, SteamIcon } from '../../components/SteamIcon';
import CollapsibleSection from '../../components/CollapsibleSection';
import { useLocaleDict } from '../../i18n';
import ruPromo from '../../i18n/locales/ru/promo';
import enPromo from '../../i18n/locales/en/promo';

export default function PromoPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const c = useLocaleDict(ruPromo, enPromo);

  // Сами коды промокодов — технические значения (см. ТЗ п.10), не переводятся,
  // но берутся отдельно от label/hint (те переводятся через c.codes[i]).
  const CODE_VALUES = ['PGYXTB4N', 'PI1OQGYH'];

  function copy(code: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(cur => (cur === code ? null : cur)), 1500);
  }

  return (
    <div className="page promo-page">
      <div className="promo-hero">
        <a
          className="promo-hero-icon"
          href={STEAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={c.steamLinkTitle}
          aria-label={c.steamLinkTitle}
        >
          <SteamIcon size={30} />
        </a>
        <h1 className="promo-hero-title">{c.heroTitlePrefix}<span className="promo-accent">{c.heroTitleAccent}</span></h1>
        <p className="promo-hero-sub">{c.heroSubtitle}</p>
      </div>

      {/* Промокоды */}
      <div className="promo-codes-grid">
        {c.codes.map((p, i) => (
          <div className="card promo-code-card" key={CODE_VALUES[i]}>
            <div className="promo-code-label">{p.label}</div>
            <div className="promo-code-value">{CODE_VALUES[i]}</div>
            <button className="btn btn-primary btn-shiny promo-copy-btn" onClick={() => copy(CODE_VALUES[i])}>
              {copiedCode === CODE_VALUES[i] ? c.copied : c.copy}
            </button>
          </div>
        ))}
      </div>

      {/* SEO-текст — виден сразу, без спойлера */}
      <div className="card promo-seo-block">
        <h2 className="promo-section-title">{c.seoTitle}</h2>
        {c.seoParagraphs.map((p, i) => (
          <p className="promo-seo-text" key={i}>{p}</p>
        ))}
      </div>

      {/* Что в наборе */}
      <CollapsibleSection title={c.kitTitle} storageKey="spoiler_promo_kit">
        <div className="promo-kit-grid">
          {c.kitItems.map(item => (
            <div className="promo-kit-item" key={item.name}>
              <span>{item.name}</span>
              <span className="promo-kit-qty">{item.qty}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Бонусы */}
      <CollapsibleSection title={c.bonusTitle} storageKey="spoiler_promo_bonus">
        <ul className="promo-bonus-list">
          {c.bonuses.map(b => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Как активировать */}
      <CollapsibleSection title={c.stepsTitle} storageKey="spoiler_promo_steps">
        <div className="promo-steps">
          {c.steps.map((s, i) => (
            <div className="promo-step" key={s.title}>
              <div className="promo-step-num">{i + 1}</div>
              <div>
                <div className="promo-step-title">{s.title}</div>
                <div className="promo-step-text">{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* SEO-текст про сам трекер (медведи / Гора Сияния / таймеры) */}
      <CollapsibleSection title={c.trackerSeoTitle} storageKey="spoiler_promo_tracker_seo">
        <div className="promo-seo-block">
          {c.trackerSeoParagraphs.map((p, i) => (
            <p className="promo-seo-text" key={i}>{p}</p>
          ))}
        </div>
      </CollapsibleSection>

      <div className="promo-footer">{c.footer}</div>
    </div>
  );
}
