import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import PublicLandingPage from './pages/PublicLandingPage';
import BearsPage from './pages/BearsPage';
import DraugsPage from './pages/DraugsPage';
import ShiningPage from './pages/ShiningPage';
import ClanPage from './pages/ClanPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import HeartsPage from './pages/HeartsPage';
import TimersPage from './pages/TimersPage';
import TimeCalcPage from './pages/TimeCalcPage';
import PromoPage from './pages/PromoPage';
import LevelPage from './pages/LevelPage';
import FaqPage from './pages/FaqPage';
import CapturesPage from './pages/CapturesPage';
import AchievementsPage from './pages/AchievementsPage';
import AnomalyPage from './pages/AnomalyPage';
import { api } from './utils/api';
import { useSocket } from './hooks/useSocket';
import { useGlobalSoundWatcher } from './hooks/useGlobalSoundWatcher';

// Разделы приложения и их адреса — каждый пункт меню Header теперь
// соответствует отдельному пути в адресной строке.
const APP_PAGES = ['bears', 'draugs', 'shining', 'clan', 'hearts', 'profile', 'timers', 'timecalc', 'promo', 'level', 'faq', 'admin', 'captures', 'achievements', 'anomaly'];

// Разделы, которые гость (без входа) может открыть и увидеть их устройство —
// просто с заглушкой вместо реальных данных и действий (см. GuestLock).
// «Профиль» и «Админ» сюда не входят: профиль требует конкретного аккаунта,
// админка — доступ суперадмина, показывать их «превью» гостю смысла нет.
// «Захваты» не завязаны на клан или аккаунт вообще — это просто справочная
// таблица с расписанием, поэтому гость видит её без каких-либо ограничений.
// «Калькулятор времени» — из той же категории: чистая утилита без данных
// аккаунта, доступна гостю полностью, без GuestLock.
const GUEST_PREVIEW_PAGES = ['bears', 'draugs', 'shining', 'hearts', 'timers', 'clan', 'captures', 'achievements', 'timecalc', 'anomaly'];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [showAuth, setShowAuth] = useState(false);
  // Раньше это состояние жило внутри Header. У гостя разные разделы
  // рендерятся из разных мест дерева (см. ниже: ветка /level, ветка
  // GUEST_PREVIEW_PAGES, и PublicLandingPage — у промо-страницы «/» —
  // рендерит свой собственный <Header>). При переходе между такими
  // ветками React видит другую структуру дерева в этой позиции и
  // пересоздаёт <Header> с нуля, теряя его внутренний useState — из-за
  // этого открытая панель разделов "заезжала обратно", например при
  // переходе гостя на «Промокод». Подняли состояние сюда, в App, — сам
  // App не пересоздаётся при смене страницы, так что открытость панели
  // переживает любые из этих переключений.
  const [menuOpen, setMenuOpen] = useState(false);
  const [clan, setClan]       = useState(null);
  const [members, setMembers] = useState([]);
  const [bears, setBears]     = useState([]);
  const [draugs, setDraugs]   = useState([]);
  const [bans, setBans]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Shining data — общее для клана, хранится в памяти + синхронизируется через сокет
  const [shiningData, setShiningData] = useState(null);

  // Anomaly data — привязано к аккаунту (не к клану), хранится на бэкенде
  const [anomalyData, setAnomalyData] = useState(null);

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
      setDraugs(data.draugs || []);
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

  // Подгрузить якорь Аномальных прорывов — привязан к аккаунту, не к клану
  const loadAnomaly = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get('/anomaly');
      if (data?.anchorIso || data?.anchorRealMs) {
        if (data.anchorIso && !data.anchorRealMs) data.anchorRealMs = new Date(data.anchorIso).getTime();
        setAnomalyData(data);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (user) {
      loadClan();
      loadShining();
      loadAnomaly();
    }
  }, [user, loadClan, loadShining, loadAnomaly]);

  // Socket handlers
  const handleBearUpdate = useCallback((updatedBear) => {
    setBears(prev => prev.map(b => b.bear_index === updatedBear.bear_index ? updatedBear : b));
  }, []);

  const handleDraugUpdate = useCallback((updatedDraug) => {
    setDraugs(prev => prev.map(d => d.draug_index === updatedDraug.draug_index ? updatedDraug : d));
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

  useSocket(token, handleBearUpdate, handleClanUpdate, handleReconnect, handleShiningUpdate, handleHeartsUpdate, handleDraugUpdate);

  // Живёт на уровне App (не размонтируется при переключении вкладок) —
  // поэтому звуки медведей/драугов/сияния/таймеров теперь играют независимо от того,
  // какой раздел сайта сейчас открыт.
  useGlobalSoundWatcher({ token, bears, draugs, shiningData, anomalyData });

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
        setDraugs(data.draugs || []);
        setBans(data.bans || []);
        if (data.shining) setShiningData(data.shining);
      })
      .finally(() => setLoading(false));
    api.get('/anomaly')
      .then(data => {
        if (data?.anchorIso || data?.anchorRealMs) {
          if (data.anchorIso && !data.anchorRealMs) data.anchorRealMs = new Date(data.anchorIso).getTime();
          setAnomalyData(data);
        }
      })
      .catch(() => {});
  }

  function onLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setClan(null);
    setMembers([]);
    setBears([]);
    setDraugs([]);
    setBans([]);
    setShiningData(null);
    setAnomalyData(null);
    setShowAuth(false);
    navigate('/');
  }

  function onUserUpdate(updatedUser) { setUser(updatedUser); }

  // Когда игрок обновляет shining — сохраняем локально сразу,
  // бэкенд уведомит остальных через сокет
  function handleShiningChange(data) {
    setShiningData(data);
  }

  // Когда игрок обновляет якорь Аномальных прорывов — сохраняем локально
  // сразу (бэкенд уже вызван внутри AnomalyPage перед этим колбэком)
  function handleAnomalyChange(data) {
    setAnomalyData(data);
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
    // что и при заходе напрямую, но с тем же общим Header, что и везде —
    // раньше LevelPage в standalone-режиме рисовала свою урезанную шапку
    // («лого + На главную»), и та не совпадала с шапкой остальных страниц
    // (тот же баг, что был на /faq). Теперь общий Header рендерится здесь,
    // а LevelPage(standalone) отвечает только за контент и SEO-мета-теги.
    if (page === 'level' && !showAuth) {
      return (
        <>
          <Header user={null} page="level" onNavigate={setPage} onLoginClick={() => setShowAuth(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          <div className="public-landing">
            <LevelPage standalone />
          </div>
        </>
      );
    }
    // FAQ гостю тоже доступна напрямую и должна выглядеть так же, как для
    // авторизованных — с тем же общим Header (просто в режиме гостя),
    // а не отдельной урезанной шапкой.
    if (page === 'faq' && !showAuth) {
      return (
        <>
          <Header user={null} page="faq" onNavigate={setPage} onLoginClick={() => setShowAuth(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          <div className="public-landing">
            <FaqPage />
          </div>
        </>
      );
    }
    // Разделы, привязанные к клану/аккаунту (Медведи, Сияние, Учёт лута,
    // Таймеры, Клан), гость тоже видит — с тем же общим Header и с той же
    // структурой страницы (пояснение + таблица/форма), просто вместо
    // реальных данных и действий показывается GuestLock с призывом войти
    // или зарегистрироваться. Раньше клик по этим пунктам меню сразу вёл
    // на форму входа — это было неожиданно и не давало понять, что вообще
    // есть в разделе.
    //
    // Важно: проверяем именно rawSegment (адрес как он есть), а не `page` —
    // `page` подставляет 'bears' по умолчанию для ЛЮБОГО непонятного пути,
    // включая корень "/". Если бы условие ниже смотрело на `page`, гость на
    // корне сайта (где должна быть страница Промокода/лендинг) вместо неё
    // видел бы страницу «Медведи».
    if (GUEST_PREVIEW_PAGES.includes(rawSegment) && !showAuth) {
      return (
        <>
          <Header user={null} page={page} onNavigate={setPage} onLoginClick={() => setShowAuth(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          <main className="main">
            {page === 'bears' && (
              <BearsPage bears={[]} clan={null} onBearChange={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
            )}
            {page === 'draugs' && (
              <DraugsPage draugs={[]} clan={null} onDraugChange={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
            )}
            {page === 'shining' && (
              <ShiningPage clan={null} shiningData={null} onShiningChange={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
            )}
            {page === 'hearts' && (
              <HeartsPage clan={null} members={[]} user={null} onHeartsUpdate={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
            )}
            {page === 'timers' && (
              <TimersPage user={null} onLoginClick={() => setShowAuth(true)} />
            )}
            {page === 'clan' && (
              <ClanPage user={null} clan={null} members={[]} bans={[]} onClanChange={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
            )}
            {page === 'captures' && <CapturesPage />}
            {page === 'achievements' && <AchievementsPage />}
            {page === 'timecalc' && <TimeCalcPage />}
            {page === 'anomaly' && (
              <AnomalyPage user={null} anomalyData={null} onAnomalyChange={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
            )}
          </main>
        </>
      );
    }
    return showAuth
      ? <AuthPage onAuth={onAuth} onBack={() => setShowAuth(false)} />
      : <PublicLandingPage onLoginClick={() => setShowAuth(true)} onNavigate={setPage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />;
  }

  return (
    <div className="app">
      <Header user={user} page={page} onNavigate={setPage} onLogout={onLogout} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="main">
        {page === 'bears' && (
          <BearsPage bears={bears} clan={clan} onBearChange={handleBearUpdate} />
        )}
        {page === 'draugs' && (
          <DraugsPage draugs={draugs} clan={clan} onDraugChange={handleDraugUpdate} />
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
        {page === 'timecalc' && (
          <TimeCalcPage />
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
        {page === 'captures' && <CapturesPage />}
        {page === 'achievements' && <AchievementsPage />}
        {page === 'anomaly' && (
          <AnomalyPage user={user} anomalyData={anomalyData} onAnomalyChange={handleAnomalyChange} />
        )}
      </main>
    </div>
  );
}
