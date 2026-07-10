import { useState } from 'react';
import { STEAM_URL, SteamIcon } from '../components/SteamIcon';
import CollapsibleSection from '../components/CollapsibleSection';

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

const SEO_PARAGRAPHS = [
  'Stay Out — это популярная многопользовательская онлайн-игра на выживание в духе постапокалипсиса, где игрокам предстоит исследовать заражённую Зону, добывать ресурсы, крафтить снаряжение и противостоять как аномалиям, так и другим выжившим. Именно поэтому промокоды Stay Out так ценятся среди игроков — они дают заметное преимущество на старте прохождения.',
  'Наш промокод Stay Out можно активировать при создании нового персонажа и получить стартовый набор снаряжения для выживания в Зоне: броню, аптечки, еду, воду и боеприпасы, а также 7 дней премиум-подписки с ускоренным получением опыта и другими бонусами. Актуальные промокоды Stay Out 2026 регулярно обновляются, поэтому загляните на эту страницу ещё раз, если старый код перестал работать.',
  'Помимо промокодов, наше сообщество Bear Tracker ведёт учёт кланового прогресса Stay Out: отслеживание белых медведей и таймеров их возрождения, расчёт времени выхода Горы Сияния, распределение лута рейдовых боссов между участниками клана. Всё это помогает игрокам Stay Out эффективнее планировать вылазки в Зону и не терять драгоценное время впустую.',
];

const TRACKER_SEO_PARAGRAPHS = [
  'Respawn-трекер — это онлайн-инструмент, который помогает геймерам не терять время в ожидании: он считает, когда на карте снова появится нужный моб, босс или ресурсная точка, и подаёт сигнал ровно в нужный момент. Такие трекеры давно используются в MMO и survival-играх — вместо того чтобы стоять над точкой спавна с секундомером в руке, игрок занимается другими делами, а звук подскажет, когда пора возвращаться.',
  'В Stay Out белые медведи — один из самых ценных источников лута на карте, но точка появления открывается только через фиксированное время после смерти предыдущего медведя. Bear Tracker автоматически считает обратный отсчёт для каждого медведя, показывает точное время следующего спавна и подаёт отдельный звуковой сигнал за 5 минут до появления — этого времени достаточно, чтобы успеть добежать и не отдать добычу конкурирующему отряду.',
  'Гора Сияния — локация с особым игровым временем, которое течёт быстрее реального: одна игровая минута занимает 8 минут 45 секунд реального времени. Сияние активируется четыре раза в игровые сутки — в 00:00, 06:00, 12:00 и 18:00 по игровым часам — и длится один игровой час. Пересчитывать это в уме неудобно и легко ошибиться, поэтому Bear Tracker сам переводит игровое время в реальное и звуковым сигналом предупреждает клан ровно в момент начала каждого Сияния.',
  'Кроме привязанных к игре таймеров, в Bear Tracker есть универсальные пользовательские таймеры — под любую повторяющуюся задачу: перезарядку способности, откат крафта, время до следующего рейда, дедлайн клановой активности или вообще что угодно за пределами игры. Задай название и период — от минуты до нескольких суток — и трекер будет считать обратный отсчёт и подаст свой звуковой сигнал по готовности, даже если вкладка браузера свёрнута.',
  'Пользоваться Bear Tracker можно бесплатно и без установки — прямо в браузере, с телефона или компьютера. Сервис создавался игроками Stay Out для своего клана, но сам принцип — respawn-таймеры, перевод игрового времени в реальное, персональные обратные отсчёты со звуком — универсален для любых онлайн-игр и совместных задач, где важно не пропустить нужный момент.',
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
        <a
          className="promo-hero-icon"
          href={STEAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Stay Out в Steam"
          aria-label="Stay Out в Steam"
        >
          <SteamIcon size={30} />
        </a>
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

      {/* SEO-текст — виден сразу, без спойлера */}
      <div className="card promo-seo-block">
        <h2 className="promo-section-title">🎮 Stay Out — промокоды и выживание в Зоне</h2>
        {SEO_PARAGRAPHS.map((p, i) => (
          <p className="promo-seo-text" key={i}>{p}</p>
        ))}
      </div>

      {/* Что в наборе */}
      <CollapsibleSection title="🎒 Что в наборе" storageKey="spoiler_promo_kit">
        <div className="promo-kit-grid">
          {KIT_ITEMS.map(item => (
            <div className="promo-kit-item" key={item.name}>
              <span>{item.name}</span>
              <span className="promo-kit-qty">{item.qty}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Бонусы */}
      <CollapsibleSection title="⭐ Бонусы премиум (7 дней)" storageKey="spoiler_promo_bonus">
        <ul className="promo-bonus-list">
          {BONUSES.map(b => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Как активировать */}
      <CollapsibleSection title="📋 Как активировать" storageKey="spoiler_promo_steps">
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
      </CollapsibleSection>

      {/* SEO-текст про сам трекер (медведи / Гора Сияния / таймеры) */}
      <CollapsibleSection
        title="🧭 Bear Tracker — трекер респауна медведей, Горы Сияния и таймеров"
        storageKey="spoiler_promo_tracker_seo"
      >
        <div className="promo-seo-block">
          {TRACKER_SEO_PARAGRAPHS.map((p, i) => (
            <p className="promo-seo-text" key={i}>{p}</p>
          ))}
        </div>
      </CollapsibleSection>

      <div className="promo-footer">
        Bear Tracker — сообщество игроков Stay Out · Данный ресурс является неофициальным фан-проектом.
      </div>
    </div>
  );
}
