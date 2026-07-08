import { useState } from 'react';

export default function Header({ user, page, onNavigate, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { key: 'bears',   label: '🐻 Медведи' },
    { key: 'shining', label: '✨ Сияние' },
    { key: 'hearts',  label: '🫀 Учёт лута' },
    { key: 'timers',  label: '⏱️ Таймеры' },
    { key: 'level',   label: '📈 Уровень' },
    { key: 'promo',   label: '🎁 Промокод' },
    { key: 'clan',    label: '🏕️ Клан' },
    { key: 'profile', label: '👤 Профиль' },
    ...(user?.is_superadmin ? [{ key: 'admin', label: '🛡️ Админ' }] : []),
  ];

  function handleNav(key) {
    onNavigate(key);
    setMenuOpen(false);
  }

  return (
    <>
      <header className="header">
        <div className="header-logo" onClick={() => handleNav('bears')} style={{ cursor: 'pointer' }}>
          🐻‍❄️ <span className="header-title">Bear Tracker</span>
        </div>

        {/* Desktop nav */}
        <nav className="header-nav header-nav-desktop">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-btn ${page === item.key ? 'active' : ''}`}
              onClick={() => handleNav(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-user">
          <span className="user-nick">{user?.game_nick || user?.nick}</span>
          <button className="btn btn-sm btn-ghost header-logout-desktop" onClick={onLogout}>Выйти</button>
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
              <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                {user?.game_nick || user?.nick}
              </span>
            </div>
            {navItems.map(item => (
              <button
                key={item.key}
                className={`mobile-nav-btn ${page === item.key ? 'active' : ''}`}
                onClick={() => handleNav(item.key)}
              >
                {item.label}
              </button>
            ))}
            <div className="mobile-nav-divider" />
            <button className="mobile-nav-btn mobile-nav-logout" onClick={() => { onLogout(); setMenuOpen(false); }}>
              🚪 Выйти
            </button>
          </div>
        </div>
      )}
    </>
  );
}
