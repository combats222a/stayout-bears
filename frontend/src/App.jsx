import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import LevelPage from './pages/LevelPage';
import FaqPage from './pages/FaqPage';
import { api } from './utils/api';
import { useSocket } from './hooks/useSocket';
import { useGlobalSoundWatcher } from './hooks/useGlobalSoundWatcher';

// Разделы приложения и их адреса — каждый пункт меню Header теперь
// соответствует отдельному пути в адресной строке.
const APP_PAGES = ['bears', 'shining', 'clan', 'hearts', 'profile', 'timers', 'promo', 'level', 'faq', 'admin'];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
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

  // Живёт на уровне App (не размонтируется при переключении вкладок) —
  // поэтому звуки медведей/сияния/таймеров теперь играют независимо от того,
  // какой раздел сайта сейчас открыт.
  useGlobalSoundWatcher({ token, bears, shiningData });

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
    setShowAuth(false);
    navigate('/');
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

  // Текущий раздел вычисляется из адресной строки (а не из внутреннего
  // состояния) — так у каждого блока есть свой путь, кнопка «назад»
  // браузера работает, а обновление страницы (F5) остаётся на том же
  // разделе, где был игрок.
  const rawSegment = location.pathname.replace(/^\/+/, '').split('/')[0];
  const page = APP_PAGES.includes(rawSegment) ? rawSegment : 'bears';

  function setPage(key) {
    navigate(`/${key}`);
  }

  // Если игрок авторизован, но открыл корень сайта ("/") — переводим на
  // /bears, чтобы адрес всегда отражал реальный активный раздел.
  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/bears', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Раздел «Админ» доступен только суперадмину — если обычный игрок
  // каким-то образом окажется на /admin, аккуратно возвращаем на /bears.
  useEffect(() => {
    if (user && page === 'admin' && !user.is_superadmin) {
      navigate('/bears', { replace: true });
    }
  }, [user, page, navigate]);

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
    // Гость на /level должен видеть ту же публичную SEO-страницу уровней,
    // что и при заходе напрямую (main.jsx это делал раньше жёсткой
    // проверкой pathname до монтирования роутера — но так же ловили
    // авторизованных пользователей, у которых при обновлении страницы на
    // /level слетал весь интерфейс приложения). Теперь решение принимается
    // здесь, где уже точно известно, есть пользователь или нет.
    if (page === 'level' && !showAuth) {
      return <LevelPage standalone />;
    }
    // FAQ гостю тоже доступна напрямую и должна выглядеть так же, как для
    // авторизованных — с тем же общим Header (просто в режиме гостя),
    // а не отдельной урезанной шапкой.
    if (page === 'faq' && !showAuth) {
      return (
        <>
          <Header user={null} page="faq" onLoginClick={() => setShowAuth(true)} />
          <div className="public-landing">
            <FaqPage />
          </div>
        </>
      );
    }
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
        {page === 'level' && (
          <LevelPage />
        )}
        {page === 'faq' && (
          <FaqPage />
        )}
        {page === 'admin' && user.is_superadmin && (
          <AdminPage />
        )}
      </main>
    </div>
  );
}
