import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import AuthPage from '../features/auth/AuthPage';
import PublicLandingPage from '../features/public/PublicLandingPage';
import BearsPage from '../features/tracker/BearsPage';
import DraugsPage from '../features/tracker/DraugsPage';
import { useBearsStore, useDraugsStore } from '../features/tracker/stores';
import ShiningPage from '../features/shining/ShiningPage';
import { useShiningStore } from '../features/shining/store';
import ClanPage from '../features/clan/ClanPage';
import { useClanStore, useMembersStore, useBansStore } from '../features/clan/store';
import AdminPage from '../features/admin/AdminPage';
import ProfilePage from '../features/profile/ProfilePage';
import HeartsPage from '../features/hearts/HeartsPage';
import TimersPage from '../features/timers/TimersPage';
import TimeCalcPage from '../features/public/TimeCalcPage';
import PromoPage from '../features/promo/PromoPage';
import LevelPage from '../features/public/LevelPage';
import FaqPage from '../features/public/FaqPage';
import CapturesPage from '../features/captures/CapturesPage';
import AchievementsPage from '../features/achievements/AchievementsPage';
import AnomalyPage from '../features/anomaly/AnomalyPage';
import { useAnomalyStore } from '../features/anomaly/store';
import { api } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useGlobalSoundWatcher } from '../hooks/useGlobalSoundWatcher';
import { APP_PAGES, GUEST_PREVIEW_PAGES } from './routes';

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
  // Раньше clan/members/bans/shiningData/anomalyData были useState —
  // теперь живут в сторах своих фич (Zustand), App лишь подписывается
  // и наполняет их из loadClan/onAuth/сокетов/onLogout. Дочерние страницы
  // как получали их пропсами, так и получают — интерфейс не менялся.
  const clan    = useClanStore(s => s.value);
  const members = useMembersStore(s => s.value);
  const bans    = useBansStore(s => s.value);
  const bears   = useBearsStore(s => s.items);
  const draugs  = useDraugsStore(s => s.items);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Shining data — общее для клана, хранится в памяти + синхронизируется через сокет
  const shiningData = useShiningStore(s => s.value);

  // Anomaly data — привязано к аккаунту (не к клану), хранится на бэкенде
  const anomalyData = useAnomalyStore(s => s.value);

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
      useClanStore.getState().setValue(data.clan);
      useMembersStore.getState().setValue(data.members);
      useBearsStore.getState().setItems(data.bears || []);
      useDraugsStore.getState().setItems(data.draugs || []);
      useBansStore.getState().setValue(data.bans || []);
      // Если бэкенд возвращает shining — используем его
      if (data.shining) useShiningStore.getState().setValue(data.shining);
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
        useShiningStore.getState().setValue(data);
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
        useAnomalyStore.getState().setValue(data);
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
    useBearsStore.getState().updateItem(updatedBear);
  }, []);

  const handleDraugUpdate = useCallback((updatedDraug) => {
    useDraugsStore.getState().updateItem(updatedDraug);
  }, []);

  const handleClanUpdate = useCallback(() => { loadClan(); }, [loadClan]);
  const handleReconnect  = useCallback(() => { loadClan(); loadShining(); }, [loadClan, loadShining]);

  // Shining update via socket
  const handleShiningUpdate = useCallback((data) => {
    if (data?.anchorIso || data?.anchorRealMs) {
      if (data.anchorIso && !data.anchorRealMs) data.anchorRealMs = new Date(data.anchorIso).getTime();
      useShiningStore.getState().setValue(data);
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
        useClanStore.getState().setValue(data.clan);
        useMembersStore.getState().setValue(data.members);
        useBearsStore.getState().setItems(data.bears || []);
        useDraugsStore.getState().setItems(data.draugs || []);
        useBansStore.getState().setValue(data.bans || []);
        if (data.shining) useShiningStore.getState().setValue(data.shining);
      })
      .finally(() => setLoading(false));
    api.get('/anomaly')
      .then(data => {
        if (data?.anchorIso || data?.anchorRealMs) {
          if (data.anchorIso && !data.anchorRealMs) data.anchorRealMs = new Date(data.anchorIso).getTime();
          useAnomalyStore.getState().setValue(data);
        }
      })
      .catch(() => {});
  }

  function onLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    useClanStore.getState().reset();
    useMembersStore.getState().reset();
    useBearsStore.getState().reset();
    useDraugsStore.getState().reset();
    useBansStore.getState().reset();
    useShiningStore.getState().reset();
    useAnomalyStore.getState().reset();
    setShowAuth(false);
    navigate('/');
  }

  function onUserUpdate(updatedUser) { setUser(updatedUser); }

  // Когда игрок обновляет shining — сохраняем локально сразу,
  // бэкенд уведомит остальных через сокет
  function handleShiningChange(data) {
    useShiningStore.getState().setValue(data);
  }

  // Когда игрок обновляет якорь Аномальных прорывов — сохраняем локально
  // сразу (бэкенд уже вызван внутри AnomalyPage перед этим колбэком)
  function handleAnomalyChange(data) {
    useAnomalyStore.getState().setValue(data);
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
              <BearsPage clan={null} isGuest onLoginClick={() => setShowAuth(true)} />
            )}
            {page === 'draugs' && (
              <DraugsPage clan={null} isGuest onLoginClick={() => setShowAuth(true)} />
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
          <BearsPage clan={clan} />
        )}
        {page === 'draugs' && (
          <DraugsPage clan={clan} />
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
