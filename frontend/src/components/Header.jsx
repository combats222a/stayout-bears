import { useState } from 'react';
import { STEAM_URL, SteamIcon } from './SteamIcon';

// Один и тот же полный список разделов для всех — и авторизованных, и
// гостей. Гость видит те же разделы и может их открыть — Медведи, Сияние,
// Учёт лута, Таймеры и Клан рендерятся с заглушкой вместо реальных данных
// (см. GuestLock на самих страницах и GUEST_PREVIEW_PAGES в App.jsx).
// Раздел «Профиль» смысла превьюшить нет — по клику сразу открывается
// форма входа. «Уровень» и «Промокод» и так публичные, рендерятся вне
// авторизованного приложения (см. main.jsx).
const NAV_ITEMS = [
  { key: 'bears',   label: '🐻 Медведи' },
  { key: 'shining', label: '✨ Сияние' },
  { key: 'hearts',  label: '🫀 Учёт лута' },
  { key: 'timers',  label: '⏱️ Таймеры' },
  { key: 'level',   label: '📈 Уровень',  guestHref: '/level' },
  { key: 'promo',   label: '🎁 Промокод', guestHref: '/' },
  { key: 'clan',    label: '🏕️ Клан' },
  { key: 'profile', label: '👤 Профиль', guestLoginOnly: true },
];

export default function Header({ user, page, onNavigate, onLogout, onLoginClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isGuest = !user;

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.is_superadmin ? [{ key: 'admin', label: '🛡️ Админ' }] : []),
  ];

  function handleNav(key) {
    if (onNavigate) onNavigate(key);
    setMenuOpen(false);
  }

  function renderNavItem(item, className) {
    const cls = `${className} ${page === item.key ? 'active' : ''}`;
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
      <button key={item.key} className={cls} onClick={() => handleNav(item.key)}>
        {item.label}
      </button>
    );
  }

  return (
    <>
      <header className="header">
        {isGuest ? (
          <a className="header-logo" href="/" style={{ textDecoration: 'none' }}>
            🐻‍❄️ <span className="header-title">Bear Tracker</span>
          </a>
        ) : (
          <div className="header-logo" onClick={() => handleNav('bears')} style={{ cursor: 'pointer' }}>
            🐻‍❄️ <span className="header-title">Bear Tracker</span>
          </div>
        )}

        {/* Единая кнопка-триггер меню разделов — одинаковая на десктопе и телефоне */}
        <button
          className={`menu-trigger-btn ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Открыть меню разделов"
          aria-expanded={menuOpen}
        >
          <span className="menu-trigger-icon">{menuOpen ? '✕' : '☰'}</span>
          <span className="menu-trigger-label">Разделы</span>
        </button>

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
              {navItems.map(item => renderNavItem(item, 'nav-panel-btn'))}
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
    </>
  );
}
