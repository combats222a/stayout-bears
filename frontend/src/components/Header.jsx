import { useState } from 'react';

const STEAM_URL = 'https://store.steampowered.com/app/1180380/Stay_Out/';

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M11.98 0C5.71 0 .59 4.85.06 11.02l6.44 2.66a3.4 3.4 0 0 1 1.93-.6c.06 0 .12 0 .18.01l2.86-4.15v-.06a4.6 4.6 0 0 1 4.6-4.6 4.6 4.6 0 1 1 0 9.2h-.1l-4.08 2.92c0 .05.01.1.01.15a3.42 3.42 0 0 1-6.79.59L.4 15.03C1.55 20.2 6.31 24 11.98 24c6.63 0 12-5.37 12-12s-5.37-12-12-12zM7.7 18.2l-1.47-.61a2.58 2.58 0 0 0 1.34 1.26 2.6 2.6 0 0 0 3.4-1.4 2.57 2.57 0 0 0-1.4-3.38 2.6 2.6 0 0 0-1.98-.02l1.52.63a1.91 1.91 0 1 1-1.41 3.52zm9.4-9.66a3.07 3.07 0 1 0-6.13 0 3.07 3.07 0 0 0 6.13 0zm-5.36 0a2.3 2.3 0 1 1 4.6 0 2.3 2.3 0 0 1-4.6 0z"/>
    </svg>
  );
}

// Один и тот же полный список разделов для всех — и авторизованных, и
// гостей. Гость видит точно ту же шапку, просто клик по разделу, которого
// без входа не существует, открывает форму входа вместо перехода.
// Разделы, доступные и без регистрации (Промокод, Уровень), у гостя
// остаются обычной ссылкой — те страницы рендерятся вне авторизованного
// приложения (см. main.jsx).
const NAV_ITEMS = [
  { key: 'bears',   label: '🐻 Медведи' },
  { key: 'shining', label: '✨ Сияние' },
  { key: 'hearts',  label: '🫀 Учёт лута' },
  { key: 'timers',  label: '⏱️ Таймеры' },
  { key: 'level',   label: '📈 Уровень',  guestHref: '/level' },
  { key: 'promo',   label: '🎁 Промокод', guestHref: '/' },
  { key: 'clan',    label: '🏕️ Клан' },
  { key: 'profile', label: '👤 Профиль' },
];

export default function Header({ user, page, onNavigate, onLogout, onLoginClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isGuest = !user;

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.is_superadmin ? [{ key: 'admin', label: '🛡️ Админ' }] : []),
  ];

  function handleNav(key) {
    onNavigate(key);
    setMenuOpen(false);
  }

  function renderNavItem(item, className) {
    const cls = `${className} ${page === item.key ? 'active' : ''}`;
    if (isGuest && item.guestHref) {
      return <a key={item.key} className={cls} href={item.guestHref}>{item.label}</a>;
    }
    if (isGuest) {
      // Раздел не открыт гостям — по клику предлагаем войти/зарегистрироваться.
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

        {/* Desktop nav */}
        <nav className="header-nav header-nav-desktop">
          {navItems.map(item => renderNavItem(item, 'nav-btn'))}
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
          {/* Hamburger — mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Меню"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-nav-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-nav-user">
              {isGuest ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { onLoginClick(); setMenuOpen(false); }}
                >
                  Войти / Зарегистрироваться
                </button>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                  {user?.game_nick || user?.nick}
                </span>
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
            {navItems.map(item => renderNavItem(item, 'mobile-nav-btn'))}
            {!isGuest && (
              <>
                <div className="mobile-nav-divider" />
                <button className="mobile-nav-btn mobile-nav-logout" onClick={() => { onLogout(); setMenuOpen(false); }}>
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
