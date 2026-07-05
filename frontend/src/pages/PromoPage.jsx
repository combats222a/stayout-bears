import { useState } from 'react';

const PROMO_CODES = [
  { code: 'PGYXTB4N', label: 'Промокод #1', hint: 'Для нового аккаунта' },
  { code: 'PI1OQGYH', label: 'Промокод #2', hint: 'Для второго аккаунта' },
];

const KIT_ITEMS = [
  { name: 'Премиум-аккаунт', qty: '7 дней' },
  { name: 'Бронежилет 6Б1', qty: '×1' },
  { name: 'Санитарный набор', qty: '×1' },
  { name: 'От радиации', qty: '×3' },
  { name: 'Антидот', qty: '×1' },
  { name: 'Бинты', qty: '×3' },
  { name: 'Жареное мясо', qty: '×5' },
  { name: 'Вода 0.5л', qty: '×3' },
  { name: 'Картечь 12×70', qty: '×100' },
  { name: 'Патрон 7.62×38R', qty: '×150' },
];

const BONUSES = [
  '×2 опыт за всё',
  '−50% на переходы у Проводников',
  'Повышенный шанс лута с мобов',
  'Быстрая доставка посылок',
  '+1 лот на Доску объявлений',
  '−1% комиссии на Доске',
  '+20% очков торговли за задания',
];

const STEPS = [
  {
    title: 'Ввести промокод',
    text: 'На экране выбора персонажа нажми [ВВЕСТИ ПРОМОКОД], введи код и нажми «Применить». Подарочный набор появится в Хранилище аккаунта.',
  },
  {
    title: 'Забрать набор',
    text: 'В безопасной зоне открой инвентарь [I]. В левом верхнем углу нажми на иконку коробки — откроется Хранилище. Перетащи набор в инвентарь.',
  },
  {
    title: 'Активировать подписку',
    text: '[ПКМ] по Подарочному набору → «Использовать». Затем [ПКМ] по Подарочной премиальной подписке → «Использовать». Готово — 7 дней премиума активированы.',
  },
];

const ENCYCLOPEDIA_LINKS = [
  { label: 'Задания', href: 'https://combats222a.github.io/stayoutcodex/ru/zadaniya/zadaniya.html' },
  { label: 'События', href: 'https://combats222a.github.io/stayoutcodex/ru/sobytiya/sobytiya.html' },
  { label: 'Локации', href: 'https://combats222a.github.io/stayoutcodex/ru/lokacii/lokacii.html' },
  { label: 'Персонажи', href: 'https://combats222a.github.io/stayoutcodex/ru/personazhi/personazhi.html' },
  { label: 'Группировки', href: 'https://combats222a.github.io/stayoutcodex/ru/gruppirovki/gruppirovki.html' },
  { label: 'Оружие', href: 'https://combats222a.github.io/stayoutcodex/ru/oruzhie/oruzhie.html' },
  { label: 'Боеприпасы', href: 'https://combats222a.github.io/stayoutcodex/ru/boepripasy/boepripasy.html' },
  { label: 'Экипировка', href: 'https://combats222a.github.io/stayoutcodex/ru/ekipirovka/ekipirovka.html' },
  { label: 'Предметы', href: 'https://combats222a.github.io/stayoutcodex/ru/predmety/predmety.html' },
  { label: 'Артефакты', href: 'https://combats222a.github.io/stayoutcodex/ru/artefakty/artefakty.html' },
  { label: 'Аномалии', href: 'https://combats222a.github.io/stayoutcodex/ru/anomalii/anomalii.html' },
  { label: 'Противники', href: 'https://combats222a.github.io/stayoutcodex/ru/protivniki/protivniki.html' },
  { label: 'Тайники', href: 'https://combats222a.github.io/stayoutcodex/ru/tayniki/tayniki.html' },
  { label: 'Магазин', href: 'https://combats222a.github.io/stayoutcodex/ru/magazin/magazin.html' },
  { label: 'Полезная информация', href: 'https://combats222a.github.io/stayoutcodex/ru/info/info.html' },
];

export default function PromoPage() {
  const [copiedCode, setCopiedCode] = useState(null);

  function copy(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(c => (c === code ? null : c)), 1500);
  }

  return (
    <div className="page promo-page">
      <div className="promo-hero">
        <div className="promo-hero-icon">🎁</div>
        <h1 className="promo-hero-title">Начни путь в <span className="promo-accent">Stay Out</span></h1>
        <p className="promo-hero-sub">
          Введи промокод при создании персонажа и получи снаряжение для выживания + 7 дней премиум-подписки
        </p>
      </div>

      {/* Промокоды */}
      <div className="promo-codes-grid">
        {PROMO_CODES.map(p => (
          <div className="card promo-code-card" key={p.code}>
            <div className="promo-code-label">{p.label}</div>
            <div className="promo-code-value">{p.code}</div>
            <div className="promo-code-hint">{p.hint}</div>
            <button className="btn btn-primary promo-copy-btn" onClick={() => copy(p.code)}>
              {copiedCode === p.code ? '✓ Скопировано' : 'Скопировать'}
            </button>
          </div>
        ))}
      </div>

      {/* Что в наборе */}
      <div className="card">
        <h2 className="promo-section-title">🎒 Что в наборе</h2>
        <div className="promo-kit-grid">
          {KIT_ITEMS.map(item => (
            <div className="promo-kit-item" key={item.name}>
              <span>{item.name}</span>
              <span className="promo-kit-qty">{item.qty}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Бонусы */}
      <div className="card">
        <h2 className="promo-section-title">⭐ Бонусы премиум (7 дней)</h2>
        <ul className="promo-bonus-list">
          {BONUSES.map(b => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      {/* Как активировать */}
      <div className="card">
        <h2 className="promo-section-title">📋 Как активировать</h2>
        <div className="promo-steps">
          {STEPS.map((s, i) => (
            <div className="promo-step" key={s.title}>
              <div className="promo-step-num">{i + 1}</div>
              <div>
                <div className="promo-step-title">{s.title}</div>
                <div className="promo-step-text">{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Энциклопедия */}
      <div className="card">
        <h2 className="promo-section-title">📚 Энциклопедия</h2>
        <div className="promo-encyclopedia-grid">
          {ENCYCLOPEDIA_LINKS.map(l => (
            <a
              className="promo-enc-link"
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="promo-footer">
        STAY OUT // WIKI · Данный ресурс является неофициальным фан-сайтом.
      </div>
    </div>
  );
}
