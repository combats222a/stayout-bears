import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import BearsPage from './pages/BearsPage';
import ClanPage from './pages/ClanPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import { api } from './utils/api';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [page, setPage] = useState('bears');
  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [bears, setBears] = useState([]);
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ user }) => { setUser(user); })
      .catch(() => { localStorage.removeItem('token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  // Load clan data
  const loadClan = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/clans/me');
      setClan(data.clan);
      setMembers(data.members);
      setBears(data.bears || []);
      setBans(data.bans || []);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (user) loadClan();
  }, [user, loadClan]);

  // Socket handlers
  const handleBearUpdate = useCallback((updatedBear) => {
    setBears(prev => prev.map(b => b.bear_index === updatedBear.bear_index ? updatedBear : b));
  }, []);

  const handleClanUpdate = useCallback(() => {
    loadClan();
  }, [loadClan]);

  const handleReconnect = useCallback(() => {
    loadClan();
  }, [loadClan]);

  useSocket(token, handleBearUpdate, handleClanUpdate, handleReconnect);

  useEffect(() => {
    if (!token || !clan) return;
    const id = setInterval(loadClan, 30000);
    return () => clearInterval(id);
  }, [token, clan, loadClan]);

  function onAuth(newUser, newToken) {
    setToken(newToken);
    setUser(newUser);
    setLoading(true);
    api.get('/clans/me')
      .then(data => { setClan(data.clan); setMembers(data.members); setBears(data.bears || []); setBans(data.bans || []); })
      .finally(() => setLoading(false));
  }

  function onLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setClan(null);
    setMembers([]);
    setBears([]);
    setBans([]);
    setPage('bears');
  }

  function onUserUpdate(updatedUser) {
    setUser(updatedUser);
  }

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-icon">🐻‍❄️</div>
        <div className="splash-text">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={onAuth} />;
  }

  return (
    <div className="app">
      <Header user={user} page={page} onNavigate={setPage} onLogout={onLogout} />
      <main className="main">
        {page === 'bears' && (
          <BearsPage bears={bears} clan={clan} onBearChange={handleBearUpdate} />
        )}
        {page === 'clan' && (
          <ClanPage user={user} clan={clan} members={members} bans={bans} onClanChange={loadClan} />
        )}
        {page === 'profile' && (
          <ProfilePage user={user} onUserUpdate={onUserUpdate} onLogout={onLogout} />
        )}
        {page === 'admin' && user.is_superadmin && (
          <AdminPage />
        )}
      </main>
    </div>
  );
}
