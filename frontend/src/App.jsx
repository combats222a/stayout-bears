import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import PublicLandingPage from './pages/PublicLandingPage';
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
  const [showAuth, setShowAuth] = useState(false);
  const [clan, setClan]       = useState(null);
  const [members, setMembers] = useState([]);
  const [bears, setBears]     = useState([]);
  const [bans, setBans]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Shining data — общее для клана, хранится в памяти + синхронизируется через сокет
  const [shiningData, setShiningData] = useState(null);

  // Колбэк для перезагрузки сердец (устанавливается из HeartsPage)
  const [heartsReloader, setHeartsReloader] = useState(null);

  // Load user on mount. При холодном старте хостинга бэкенд может не успеть
  // ответить вовремя — в этом случае токен НЕ трогаем и пробуем ещё раз,
  // а не кидаем игрока обратно на экран логина.
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;

    async function loadUser(attempt = 1) {
      try {
        const { user } = await api.get('/auth/me');
        if (cancelled) return;
        setUser(user);
        setConnectionError(false);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const isAuthFailure = err.status === 401 || err.status === 403;
        if (isAuthFailure) {
          // Токен реально невалиден/просрочен — только тогда разлогиниваем
          localStorage.removeItem('token');
          setToken(null);
          setConnectionError(false);
          setLoading(false);
          return;
        }
        // Сеть/сервер ещё не готов (холодный старт хостинга и т.п.) — повторяем,
        // не удаляя токен, чтобы не заставлять вводить логин/пароль заново
        if (attempt < 5) {
          setTimeout(() => loadUser(attempt + 1), 2000);
        } else {
          // Сервер так и не ответил — оставляем токен, показываем "повтори попытку"
          setConnectionError(true);
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => { cancelled = true; };
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
    setShowAuth(false);
  }

  function onUserUpdate(updatedUser) { setUser(updatedUser); }

  // Когда игрок обновляет shining — сохраняем локально сразу,
  // бэкенд уведомит остальных через сокет
  function handleShiningChange(data) {
    setShiningData(data);
  }

  function retryConnection() {
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-icon">🐻‍❄️</div>
        <div className="splash-text">Загрузка...</div>
      </div>
    );
  }

  if (connectionError && token) {
    return (
      <div className="splash">
        <div className="splash-icon">🐻‍❄️</div>
        <div className="splash-text">Не удалось связаться с сервером</div>
        <div className="splash-text" style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          Сервер, вероятно, ещё запускается. Вход не потребуется — просто попробуй ещё раз.
        </div>
        <button className="modal-btn-ok" style={{ marginTop: 16 }} onClick={retryConnection}>
          Повторить
        </button>
      </div>
    );
  }

  if (!user) {
    return showAuth
      ? <AuthPage onAuth={onAuth} onBack={() => setShowAuth(false)} />
      : <PublicLandingPage onLoginClick={() => setShowAuth(true)} />;
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
