import { useState } from 'react';
import { STEAM_URL, SteamIcon } from './SteamIcon';

// Один и тот же полный список разделов для всех — и авторизованных, и
// гостей. Гость видит те же разделы и может их открыть — Медведи, Сияние,
// Учёт лута, Таймеры и Клан рендерятся с заглушкой вместо реальных данных
// (см. GuestLock на самих страницах и GUEST_PREVIEW_PAGES в App.jsx).
// Раздел «Профиль» смысла превьюшить нет — по клику сразу открывается
// форма входа. «Уровень» и «Промокод» и так публичные, рендерятся вне
// авторизованного приложения (см. main.jsx).
// Основные разделы — видны прямо в шапке на десктопе всегда.
const NAV_ITEMS = [
  { key: 'bears',   label: '🐻 Медведи' },
  { key: 'shining', label: '✨ Сияние' },
  { key: 'hearts',  label: '🫀 Учёт лута' },
  { key: 'timers',  label: '⏱️ Таймеры' },
  { key: 'promo',   label: '🎁 Промокод', guestHref: '/' },
  { key: 'captures', label: '🚩 Захваты' },
  { key: 'clan',     label: '🏕️ Клан' },
  { key: 'profile',  label: '👤 Профиль', guestLoginOnly: true },
];

// Второстепенные разделы — убраны из верхней строки, доступны только через
// кнопку «☰ Разделы» (и на десктопе, и на телефоне).
const MENU_ONLY_ITEMS = [
  { key: 'achievements', label: '🏆 Достижения' },
  { key: 'level',        label: '📈 Уровень',     guestHref: '/level' },
  { key: 'timecalc',     label: '🧮 Калькулятор времени' },
  { key: 'draugs',       label: '💀 Драуги' },
  { key: 'anomaly',      label: '🥶 Аномальные прорывы' },
];

export default function Header({ user, page, onNavigate, onLogout, onLoginClick }) {
  // Панель разделов (и на десктопе, и на телефоне) всегда стартует
  // свёрнутой при каждой загрузке страницы — состояние нигде не
  // запоминается. Открывается только явным кликом пользователя на «☰».
  const [menuOpen, setMenuOpen] = useState(false);
  const isGuest = !user;

  const isMenuOnlyPage = MENU_ONLY_ITEMS.some(item => item.key === page);

  const adminItems = user?.is_superadmin ? [{ key: 'admin', label: '🛡️ Админ' }] : [];
  // Показывается всегда в верхней строке на десктопе; на телефоне (где верхняя
  // строка скрыта) те же пункты дублируются внутри панели «Разделы».
  const navItems = [...NAV_ITEMS, ...adminItems];

  function handleNav(key) {
    if (onNavigate) onNavigate(key);
    setMenuOpen(false);
  }

  function renderNavItem(item, className, extraClass = '', { keepOpen = false } = {}) {
    const cls = `${className} ${extraClass} ${page === item.key ? 'active' : ''}`;
    if (isGuest && item.guestHref) {
      return <a key={item.key} className={cls} href={item.guestHref}>{item.label}</a>;
    }
    if (isGuest && item.guestLoginOnly) {
      // Раздел не имеет смысла показывать гостю (например, личный профиль) —
      // по клику сразу предлагаем войти/зарегистрироваться.
      return (
        <button key={item.key} className={cls} onClick={onLoginClick}>
          {item.label}
        </button>
      );
    }
    return (
      <button
        key={item.key}
        className={cls}
        onClick={() => (keepOpen ? onNavigate?.(item.key) : handleNav(item.key))}
      >
        {item.label}
      </button>
    );
  }

  return (
    <>
      <header className="header">
        {/* Кнопка-триггер панели разделов — квадратная, только иконка,
            стоит перед логотипом (по аналогии с гамбургером Википедии). */}
        <button
          className={`menu-trigger-btn ${menuOpen || isMenuOnlyPage ? 'active' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Открыть меню разделов"
          aria-expanded={menuOpen}
        >
          <span className="menu-trigger-icon">{menuOpen ? '✕' : '☰'}</span>
        </button>

        {isGuest ? (
          <a className="header-logo" href="/" style={{ textDecoration: 'none' }}>
            🐻‍❄️ <span className="header-title">Bear Tracker</span>
          </a>
        ) : (
          <div className="header-logo" onClick={() => handleNav('bears')} style={{ cursor: 'pointer' }}>
            🐻‍❄️ <span className="header-title">Bear Tracker</span>
          </div>
        )}

        {/* Разделы всегда видны в шапке на десктопе; на телефоне скрыты —
            там для них не хватает места, доступ через кнопку выше. */}
        <nav className="header-nav-desktop">
          {navItems.map(item => renderNavItem(item, 'header-nav-btn', '', { keepOpen: true }))}
        </nav>

        <div className="header-user">
          <a className="header-faq-link" href="/faq" title="Часто задаваемые вопросы">FAQ</a>
          <a
            className="header-steam-link"
            href={STEAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Stay Out в Steam"
            aria-label="Stay Out в Steam"
          >
            <SteamIcon />
          </a>
          {isGuest ? (
            <button className="btn btn-primary btn-sm header-login-btn" onClick={onLoginClick}>
              Войти / Зарегистрироваться
            </button>
          ) : (
            <>
              <span className="user-nick">{user?.game_nick || user?.nick}</span>
              <button className="btn btn-sm btn-ghost header-logout-desktop" onClick={onLogout}>Выйти</button>
            </>
          )}
        </div>
      </header>

      {/* Панель разделов — «продолжение» шапки, открывается и на десктопе, и на телефоне */}
      {menuOpen && (
        <div className="nav-panel-overlay" onClick={() => setMenuOpen(false)}>
          <div className="nav-panel" onClick={e => e.stopPropagation()}>
            <div className="nav-panel-user">
              {isGuest ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { onLoginClick(); setMenuOpen(false); }}
                >
                  Войти / Зарегистрироваться
                </button>
              ) : (
                <span className="nav-panel-nick">{user?.game_nick || user?.nick}</span>
              )}
              <a className="header-faq-link" href="/faq" title="Часто задаваемые вопросы">FAQ</a>
              <a
                className="header-steam-link"
                href={STEAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Stay Out в Steam"
                aria-label="Stay Out в Steam"
              >
                <SteamIcon />
              </a>
            </div>
            <div className="nav-panel-list">
              {navItems.map(item => renderNavItem(item, 'nav-panel-btn', 'nav-panel-btn-primary'))}
              {MENU_ONLY_ITEMS.map(item => renderNavItem(item, 'nav-panel-btn'))}
            </div>
            {!isGuest && (
              <>
                <div className="nav-panel-divider" />
                <button className="nav-panel-btn nav-panel-logout" onClick={() => { onLogout(); setMenuOpen(false); }}>
                  🚪 Выйти
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Сайдбар второстепенных разделов — только на десктопе (на телефоне
          скрыт через CSS, там используется панель выше). Рендерится всегда,
          открытие/закрытие — через CSS-класс "open", чтобы анимация выезда
          отрабатывала и при открытии, и при закрытии.
          Никакой подложки-перехватчика под ним нет: страница под сайдбаром
          остаётся полностью кликабельной (клик на «Медведи», «Уровень» и
          т.п. в шапке работает как обычно), а сам сайдбар не закрывается
          сам по себе — только явным повторным кликом пользователя на
          «☰»/«✕» в шапке. */}
      <aside className={`desktop-sidebar ${menuOpen ? 'open' : ''}`}>
        <nav className="desktop-sidebar-list">
          {MENU_ONLY_ITEMS.map(item => renderNavItem(item, 'nav-panel-btn', '', { keepOpen: true }))}
        </nav>
      </aside>
    </>
  );
}
