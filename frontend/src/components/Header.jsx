export default function Header({ user, page, onNavigate, onLogout }) {
  return (
    <header className="header">
      <div className="header-logo" onClick={() => onNavigate('bears')} style={{ cursor: 'pointer' }}>
        🐻‍❄️ <span className="header-title">Bear Tracker</span>
      </div>

      <nav className="header-nav">
        <button
          className={`nav-btn ${page === 'bears' ? 'active' : ''}`}
          onClick={() => onNavigate('bears')}
        >
          🐻 Медведи
        </button>
        <button
          className={`nav-btn ${page === 'clan' ? 'active' : ''}`}
          onClick={() => onNavigate('clan')}
        >
          🏕️ Клан
        </button>
        {user?.is_superadmin && (
          <button
            className={`nav-btn ${page === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
          >
            🛡️ Админ
          </button>
        )}
      </nav>

      <div className="header-user">
        <span className="user-nick">{user?.nick}</span>
        <button className="btn btn-sm btn-ghost" onClick={onLogout}>Выйти</button>
      </div>
    </header>
  );
}
