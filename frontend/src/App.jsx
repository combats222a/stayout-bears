import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import BearsPage from './pages/BearsPage';
import ShiningPage from './pages/ShiningPage';
import ClanPage from './pages/ClanPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import HeartsPage from './pages/HeartsPage';
import TimersPage from './pages/TimersPage';
import PromoPage from './pages/PromoPage';
import { api } from './utils/api';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [page, setPage]       = useState('bears');
  const [clan, setClan]       = useState(null);
  const [members, setMembers] = useState([]);
  const [bears, setBears]     = useState([]);
  const [bans, setBans]       = useState([]);
  const [loading, setLoading] = useState(true);

  // Shining data — общее для клана, хранится в памяти + синхронизируется через сокет
  const [shiningData, setShiningData] = useState(null);

  // Колбэк для перезагрузки сердец (устанавливается из HeartsPage)
  const [heartsReloader, setHeartsReloader] = useState(null);

  // Load user on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ user }) => { setUser(user); })
      .catch(() => { localStorage.removeItem('token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  // Load clan data (включая shining если бэкенд поддерживает)
  const loadClan = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/clans/me');
      setClan(data.clan);
      setMembers(data.members);
      setBears(data.bears || []);
      setBans(data.bans || []);
      // Если бэкенд возвращает shining — используем его
      if (data.shining) setShiningData(data.shining);
    } catch {}
  }, [token]);

  // Подгрузить shining отдельным запросом (если роут есть)
  const loadShining = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/shining');
      if (data?.anchorIso || data?.anchorRealMs) {
        // Обеспечиваем наличие anchorRealMs
        if (data.anchorIso && !data.anchorRealMs) data.anchorRealMs = new Date(data.anchorIso).getTime();
        setShiningData(data);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (user) {
      loadClan();
      loadShining();
    }
  }, [user, loadClan, loadShining]);

  // Socket handlers
  const handleBearUpdate = useCallback((updatedBear) => {
    setBears(prev => prev.map(b => b.bear_index === updatedBear.bear_index ? updatedBear : b));
  }, []);

  const handleClanUpdate = useCallback(() => { loadClan(); }, [loadClan]);
  const handleReconnect  = useCallback(() => { loadClan(); loadShining(); }, [loadClan, loadShining]);

  // Shining update via socket
  const handleShiningUpdate = useCallback((data) => {
    if (data?.anchorIso || data?.anchorRealMs) {
      if (data.anchorIso && !data.anchorRealMs) data.anchorRealMs = new Date(data.anchorIso).getTime();
      setShiningData(data);
    }
  }, []);

  // Hearts update via socket
  const handleHeartsUpdate = useCallback(() => {
    if (heartsReloader) heartsReloader();
  }, [heartsReloader]);

  useSocket(token, handleBearUpdate, handleClanUpdate, handleReconnect, handleShiningUpdate, handleHeartsUpdate);

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
      .then(data => {
        setClan(data.clan);
        setMembers(data.members);
        setBears(data.bears || []);
        setBans(data.bans || []);
        if (data.shining) setShiningData(data.shining);
      })
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
    setShiningData(null);
    setPage('bears');
  }

  function onUserUpdate(updatedUser) { setUser(updatedUser); }

  // Когда игрок обновляет shining — сохраняем локально сразу,
  // бэкенд уведомит остальных через сокет
  function handleShiningChange(data) {
    setShiningData(data);
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
        {page === 'shining' && (
          <ShiningPage
            clan={clan}
            shiningData={shiningData}
            onShiningChange={handleShiningChange}
          />
        )}
        {page === 'clan' && (
          <ClanPage user={user} clan={clan} members={members} bans={bans} onClanChange={loadClan} />
        )}
        {page === 'hearts' && (
          <HeartsPage
            clan={clan}
            members={members}
            user={user}
            onHeartsUpdate={setHeartsReloader}
          />
        )}
        {page === 'profile' && (
          <ProfilePage user={user} onUserUpdate={onUserUpdate} onLogout={onLogout} />
        )}
        {page === 'timers' && (
          <TimersPage user={user} />
        )}
        {page === 'promo' && (
          <PromoPage />
        )}
        {page === 'admin' && user.is_superadmin && (
          <AdminPage />
        )}
      </main>
    </div>
  );
}
