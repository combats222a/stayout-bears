import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import AuthPage from '../features/auth/AuthPage';
import PublicLandingPage from '../features/public/PublicLandingPage';
import PromoPage from '../features/promo/PromoPage';
import { useBearsStore, useDraugsStore } from '../features/tracker/stores';
import type { ShiningStateData } from '../features/shining/ShiningPage';
import { useShiningStore } from '../features/shining/store';
import { useClanStore, useMembersStore, useBansStore } from '../features/clan/store';
import { useAnomalyStore } from '../features/anomaly/store';
import type { AnomalyStateData } from '../features/anomaly/AnomalyPage';

// Раздел рендерится только когда игрок реально на нём находится (см. `page === '...'`
// ниже), но раньше все 15 страниц импортировались наверху статически — это грузило
// ВСЁ (включая Admin, Achievements, Timers на 850 строк) в один бандл ещё до первого
// рендера. React.lazy разбивает каждую страницу на отдельный чанк, который Vite
// скачивает только при первом заходе в конкретный раздел (и кэширует браузером на
// будущее). Header/AuthPage/PublicLandingPage остались обычным импортом — это самое
// первое, что видит гость, лишний сетевой запрос здесь ни к чему.
const BearsPage        = lazy(() => import('../features/tracker/BearsPage'));
const DraugsPage       = lazy(() => import('../features/tracker/DraugsPage'));
const ShiningPage      = lazy(() => import('../features/shining/ShiningPage'));
const ClanPage         = lazy(() => import('../features/clan/ClanPage'));
const AdminPage        = lazy(() => import('../features/admin/AdminPage'));
const ProfilePage      = lazy(() => import('../features/profile/ProfilePage'));
const HeartsPage       = lazy(() => import('../features/hearts/HeartsPage'));
const TimersPage       = lazy(() => import('../features/timers/TimersPage'));
const TimeCalcPage     = lazy(() => import('../features/public/TimeCalcPage'));
const LevelPage        = lazy(() => import('../features/public/LevelPage'));
const FaqPage          = lazy(() => import('../features/public/FaqPage'));
const CapturesPage     = lazy(() => import('../features/captures/CapturesPage'));
const AchievementsPage = lazy(() => import('../features/achievements/AchievementsPage'));
const AnomalyPage      = lazy(() => import('../features/anomaly/AnomalyPage'));

// Тот же визуальный паттерн, что уже используется внутри страниц во время
// собственной загрузки данных (см. AdminPage/TimersPage) — так переключение
// раздела не привносит новый, ранее не виданный вид "загрузки".
const pageFallback = <div className="page"><div className="loading">Загрузка...</div></div>;
import { api } from '../utils/api';
import { useSocket, getSocket } from '../hooks/useSocket';
import { useGlobalSoundWatcher } from '../hooks/useGlobalSoundWatcher';
import { APP_PAGES, GUEST_PREVIEW_PAGES } from './routes';
import type { AuthUser, BearWithKiller, DraugWithKiller } from '../types/entities';
import type { ApiError } from '../types/api';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(() => localStorage.getItem('token'));
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
  const bears   = useBearsStore(s => s.items) as BearWithKiller[];
  const draugs  = useDraugsStore(s => s.items) as DraugWithKiller[];
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Shining data — общее для клана, хранится в памяти + синхронизируется через сокет
  const shiningData = useShiningStore(s => s.value);

  // Anomaly data — привязано к аккаунту (не к клану), хранится на бэкенде
  const anomalyData = useAnomalyStore(s => s.value);

  // Колбэк для перезагрузки сердец (устанавливается из HeartsPage)
  const [heartsReloader, setHeartsReloader] = useState<(() => Promise<void>) | null>(null);

  // Load user on mount. При холодном старте хостинга бэкенд может не успеть
  // ответить вовремя — в этом случае токен НЕ трогаем и пробуем ещё раз,
  // а не кидаем игрока обратно на экран логина.
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;

    async function loadUser(attempt = 1): Promise<void> {
      try {
        const { user } = await api.get('/auth/me');
        if (cancelled) return;
        setUser(user);
        setConnectionError(false);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const status = (err as ApiError).status;
        const isAuthFailure = status === 401 || status === 403;
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
  const handleBearUpdate = useCallback((updatedBear: BearWithKiller) => {
    useBearsStore.getState().updateItem(updatedBear);
  }, []);

  const handleDraugUpdate = useCallback((updatedDraug: DraugWithKiller) => {
    useDraugsStore.getState().updateItem(updatedDraug);
  }, []);

  const handleClanUpdate = useCallback(() => { loadClan(); }, [loadClan]);
  const handleReconnect  = useCallback(() => { loadClan(); loadShining(); }, [loadClan, loadShining]);

  // Shining update via socket
  const handleShiningUpdate = useCallback((data: ShiningStateData) => {
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

  // ИСПРАВЛЕНО: на бэкенде уже есть обработчики join:clan/leave:clan
  // (backend/src/sockets/handlers/connection.ts), но фронтенд их никогда
  // не вызывал. Из-за этого сокет, подключившийся ДО того как игрок
  // создал/вступил в клан (или сменил клан — вышел/кикнули/перевели
  // лидерство), оставался вне комнаты `clan:<id>` на всё время текущего
  // соединения — события bear:update/draug:update/shining:update/
  // hearts:update для нового клана тихо переставали доходить до вкладки,
  // пока не произойдёт полная перезагрузка страницы (новое соединение
  // сокета заново читает clan_id из БД). Теперь при каждом изменении
  // clan.id явно уходим из старой комнаты и заходим в новую.
  const prevClanIdRef = useRef<number | null>(null);
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const prevId = prevClanIdRef.current;
    const newId = clan?.id ?? null;
    if (prevId === newId) return;
    if (prevId != null) socket.emit('leave:clan', prevId);
    if (newId != null) socket.emit('join:clan', newId);
    prevClanIdRef.current = newId;
  }, [clan?.id]);

  // Живёт на уровне App (не размонтируется при переключении вкладок) —
  // поэтому звуки медведей/драугов/сияния/таймеров теперь играют независимо от того,
  // какой раздел сайта сейчас открыт.
  useGlobalSoundWatcher({ token, bears, draugs, shiningData, anomalyData });

  useEffect(() => {
    if (!token || !clan) return;
    const id = setInterval(loadClan, 30000);
    return () => clearInterval(id);
  }, [token, clan, loadClan]);

  function onAuth(newUser: AuthUser, newToken: string) {
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

  function onUserUpdate(updatedUser: AuthUser) { setUser(updatedUser); }

  // Когда игрок обновляет shining — сохраняем локально сразу,
  // бэкенд уведомит остальных через сокет
  function handleShiningChange(data: ShiningStateData) {
    useShiningStore.getState().setValue(data);
  }

  // Когда игрок обновляет якорь Аномальных прорывов — сохраняем локально
  // сразу (бэкенд уже вызван внутри AnomalyPage перед этим колбэком)
  function handleAnomalyChange(data: AnomalyStateData) {
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

  function setPage(key: string) {
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
            <Suspense fallback={pageFallback}>
              <LevelPage standalone />
            </Suspense>
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
            <Suspense fallback={pageFallback}>
              <FaqPage />
            </Suspense>
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
            <Suspense fallback={pageFallback}>
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
                <ClanPage user={null as unknown as AuthUser} clan={null} members={[]} bans={[]} onClanChange={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
              )}
              {page === 'captures' && <CapturesPage />}
              {page === 'achievements' && <AchievementsPage />}
              {page === 'timecalc' && <TimeCalcPage />}
              {page === 'anomaly' && (
                <AnomalyPage user={null} anomalyData={null} onAnomalyChange={() => {}} isGuest onLoginClick={() => setShowAuth(true)} />
              )}
            </Suspense>
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
        <Suspense fallback={pageFallback}>
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
        </Suspense>
      </main>
    </div>
  );
}
