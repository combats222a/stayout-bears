import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { api } from '../utils/api';
import {
  DRAUGS_LIST, getDraugMeta, getDraugStatus,
  getTimeLeftMs, formatCountdown, formatClock, formatElapsed, getProgress,
  parseLocalTimeInput, killedAtFromSpawnAt
} from '../utils/draugs';
import { isDraugSoundEnabled, setDraugSoundEnabled } from '../utils/soundPrefs';
import useIsMobile from '../hooks/useIsMobile';
import SoundIcon from '../components/SoundIcon';
import MaskedTimeInput, { digitsToTimeStr } from '../components/MaskedTimeInput';
import InfoSpoiler from '../components/InfoSpoiler';
import GuestLock from '../components/GuestLock';
import { DRAUGS_SPOILER } from '../content/spoilerContent';

// ── Modal for entering kill time ─────────────────────────────────────────────
function KillTimeModal({ draugName, onCommit, onClose }) {
  const [digits, setDigits] = useState(() => {
    // Pre-fill with current local time (только цифры)
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}${mm}${ss}`;
  });
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!digits) { setError('Введи время — просто цифры, например 093500'); return; }
    const timeStr = digitsToTimeStr(digits, 3);
    const iso = parseLocalTimeInput(timeStr);
    if (!iso) { setError('Неверное время'); return; }
    onCommit(iso);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⏱ Время смерти — <span className="modal-bear-name">{draugName}</span></div>
        <div className="modal-body">
          <label className="modal-label">Введи время когда убили драуга (только цифры)</label>
          <MaskedTimeInput
            segments={3}
            value={digits}
            onChange={d => { setDigits(d); setError(''); }}
            onEnter={handleSubmit}
            placeholder="09:35:00"
            autoFocus
          />
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-hint">Backspace удаляет время справа налево: секунды → минуты → часы. Затем просто вводи цифры — двоеточия расставятся сами · Время твоего часового пояса</div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="modal-btn-ok" onClick={handleSubmit}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── Draug row ───────────────────────────────────────────────────────────────
function DraugRow({ draug, onKill, onVanish, onReset, onManualTime }) {
  const [showModal, setShowModal] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isDraugSoundEnabled(draug.draug_index));
  const isMobile = useIsMobile();

  // Как и в BearsPage: раньше у каждой строки был свой setInterval со
  // случайным сдвигом старта (специально чтобы тики разных строк НЕ
  // совпадали в один кадр). На слабом/багованном GPU (Redmi 8 Pro) это
  // давало обратный эффект — непрерывный поток из ~10+ независимых
  // асинхронных частичных перерисовок в секунду, размазанных по экрану,
  // страница никогда не в стабильном состоянии. Теперь тик общий для всей
  // страницы (см. forceTick в DraugsPage) — все строки обновляются одним
  // атомарным рендером раз в секунду.
  const ms   = getTimeLeftMs(draug);
  const elap = formatElapsed(draug.killed_at);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setDraugSoundEnabled(draug.draug_index, next);
  }

  const isDead    = getDraugStatus(draug) === 'dead';
  const isReady   = draug.spawn_at && !isDead;
  const isWarning = isDead && ms <= 60_000;
  const meta      = getDraugMeta(draug.draug_index);
  const pct       = getProgress(draug);
  const isActive  = isDead || isReady;

  let rowCls = 'bear-row';
  if (isReady)        rowCls += ' row-ready';
  else if (isWarning) rowCls += ' row-warn';
  else if (isDead)    rowCls += ' row-active';

  let dotCls = 'sdot';
  if (isReady)        dotCls += ' sdot-green';
  else if (isWarning) dotCls += ' sdot-orange';
  else if (isDead)    dotCls += ' sdot-blue';

  let timerColor = '';
  if (isReady)        timerColor = '#50c878';
  else if (isWarning) timerColor = '#e0a030';
  else if (isDead)    timerColor = '#c8d6e5';

  let barColor = '#1e3a5f';
  if (isReady)        barColor = '#50c878';
  else if (isWarning) barColor = '#e0a030';
  else if (isDead)    barColor = '#4a9edd';

  const spawnDisplay  = formatClock(draug.spawn_at);
  const killedDisplay = formatClock(draug.killed_at);

  // ПОЛНОСТЬЮ отдельный, максимально лёгкий рендер для мобилки (как и в
  // BearsPage — проверено на реальном Redmi 8 Pro, предыдущие фиксы не
  // убрали баг). Нет прогресс-бара (раньше .prog-fill менял inline width
  // каждый тик — постоянный layout+paint), минимум вложенных узлов, блок
  // "Смерть/Спавн/Прошло" — одна текстовая строка.
  if (isMobile) {
    return (
      <>
        <div className={`bear-lite-card ${rowCls}`}>
          <div className="bear-lite-row1">
            <span className={dotCls} />
            <span className="bear-lite-name">{meta.name}</span>
            <span className="square-badge">{meta.square}</span>
            {isReady ? (
              <span className="spawn-tag">⚡ Спавн!</span>
            ) : (
              <span
                className="bear-lite-time"
                style={isDead ? { color: timerColor } : undefined}
                onClick={() => setShowModal(true)}
              >
                {isDead ? formatCountdown(ms) : '--:--'} ✎
              </span>
            )}
          </div>
          {isActive && (
            <div className="bear-lite-row2" onClick={() => setShowModal(true)}>
              Смерть {killedDisplay} · Спавн {spawnDisplay} · Прошло {isDead ? elap : '--:--:--'}
              {draug.killer_nick ? ` · ${draug.killer_nick}` : ''}
            </div>
          )}
          <div className="bear-lite-row3">
            {!isDead && !isReady
              ? <>
                  <button className="btn-now" style={{ flex: 1 }} onClick={() => onKill(draug.draug_index)}>Сейчас</button>
                  <button className="btn-gone" style={{ flex: 1 }} onClick={() => onVanish(draug.draug_index)}>Исчез</button>
                </>
              : <button className="btn-reset-row" style={{ flex: 1 }} onClick={() => onReset(draug.draug_index)}>✕ Сброс</button>
            }
            <button
              className={`rupor-btn rupor-btn-sm ${soundOn ? 'rupor-on' : 'rupor-off'}`}
              onClick={toggleSound}
              title={soundOn ? 'Звук по спавну включён' : 'Звук по спавну выключен'}
            >
              <SoundIcon on={soundOn} />
            </button>
          </div>
        </div>

        {showModal && (
          <KillTimeModal
            draugName={meta.name}
            onCommit={iso => onManualTime(draug.draug_index, iso)}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <tr className={rowCls}>
        <td><span className={dotCls} /></td>
        <td className="td-name">{meta.name}</td>
        <td><span className="square-badge">{meta.square}</span></td>
        <td className="td-timer">
          {isReady
            ? <span className="spawn-tag">⚡ Спавн!</span>
            : <div className="prog-wrap">
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${pct * 100}%`, background: barColor }} />
                </div>
                <span className="timer-val" style={{ color: timerColor }}>
                  {isDead ? formatCountdown(ms) : '--:--'}
                </span>
              </div>
          }
        </td>
        <td>
          <div className="act-btns">
            {!isDead && !isReady
              ? <>
                  <button className="btn-now"  onClick={() => onKill(draug.draug_index)}>Сейчас</button>
                  <button className="btn-gone" onClick={() => onVanish(draug.draug_index)}>Исчез</button>
                </>
              : <button className="btn-reset-row" onClick={() => onReset(draug.draug_index)}>✕ Сброс</button>
            }
            <button
              className={`rupor-btn rupor-btn-sm ${soundOn ? 'rupor-on' : 'rupor-off'}`}
              onClick={toggleSound}
              title={soundOn ? 'Звук по спавну включён' : 'Звук по спавну выключен'}
            >
              <SoundIcon on={soundOn} />
            </button>
          </div>
        </td>
        <td className={`td-clock${isActive ? '' : ' td-clock-empty'}`}>{isActive ? spawnDisplay : '--:--:--'}</td>
        <td className={`td-clock${isActive ? '' : ' td-clock-empty'}`}>{isActive ? elap : '--:--:--'}</td>
        <td>
          {isActive
            ? <span className="td-clock clock-editable" title="Нажми чтобы исправить время смерти" onClick={() => setShowModal(true)}>
                {killedDisplay}<span className="edit-icon"> ✎</span>
              </span>
            : <span className="td-clock clock-editable clock-empty" title="Нажми чтобы ввести время смерти" onClick={() => setShowModal(true)}>
                --:--:--<span className="edit-icon"> ✎</span>
              </span>
          }
        </td>
        <td className="td-user">{draug.killer_nick || '—'}</td>
      </tr>

      {showModal && (
        <KillTimeModal
          draugName={meta.name}
          onCommit={iso => onManualTime(draug.draug_index, iso)}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function DraugsPage({ draugs, clan, onDraugChange, isGuest, onLoginClick }) {
  const [error, setError] = useState('');
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isMobile = useIsMobile();

  // ── Фикс наложения карточек на старых Android WebView (как в BearsPage) ──
  // `clan`/`draugs` подгружаются асинхронно после монтирования страницы (см.
  // App.jsx) — полноценный `.bears-mobile-list` с карточками вставляется
  // отдельным более поздним рендером. На старом WebView (Redmi 8 Pro/MIUI)
  // такая вставка иногда не перерисовывается сама, пока клик не форсирует
  // repaint. Форсируем его программно сразу после первого появления реальных
  // данных.
  const mobileListRef = useRef(null);
  const hadContentRef = useRef(false);
  useLayoutEffect(() => {
    if (!isMobile) return;
    const hasContent = !!clan;
    if (hasContent && !hadContentRef.current) {
      hadContentRef.current = true;
      requestAnimationFrame(() => {
        const el = mobileListRef.current;
        if (!el) return;
        const prevDisplay = el.style.display;
        el.style.display = 'none';
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight;
        el.style.display = prevDisplay || '';
      });
    } else if (!hasContent) {
      hadContentRef.current = false;
    }
  }, [isMobile, clan]);

  // Один общий тик на всю страницу вместо независимых per-row таймеров
  // (см. комментарий в DraugRow) — форсирует атомарный re-render всего
  // списка раз в секунду.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mergedDraugs = DRAUGS_LIST.map(meta => {
    const found = draugs.find(d => d.draug_index === meta.index);
    return found || { draug_index: meta.index, spawn_at: null, killed_at: null, killer_nick: null };
  });

  const active = mergedDraugs.filter(d => getDraugStatus(d) === 'dead').length;
  const ready  = mergedDraugs.filter(d => d.spawn_at && getDraugStatus(d) === 'alive').length;

  async function killDraug(index, killedAt) {
    setError('');
    try {
      const body = killedAt ? { killed_at: killedAt } : {};
      const { draug } = await api.post(`/draugs/${index}/kill`, body);
      onDraugChange({ ...draug });
    } catch (e) { setError(e.message); }
  }

  async function vanishDraug(index) {
    const killedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await killDraug(index, killedAt);
  }

  async function resetDraug(index) {
    setError('');
    try {
      const { draug } = await api.post(`/draugs/${index}/reset`);
      onDraugChange({ ...draug });
    } catch (e) { setError(e.message); }
  }

  async function handleManualTime(index, killedAtIso) {
    await killDraug(index, killedAtIso);
  }

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">Драуги</h2>
        <InfoSpoiler {...DRAUGS_SPOILER} storageKey="spoiler_draugs" />
        {isGuest ? (
          <GuestLock
            icon="💀"
            title="Отслеживай спавны драугов вместе с кланом"
            text="Тайминги драугов и синхронизация с кланом доступны после регистрации — это займёт меньше минуты."
            onLoginClick={onLoginClick}
          />
        ) : (
          <div className="empty-state"><p>Вступи в клан чтобы отслеживать драугов</p></div>
        )}
      </div>
    );
  }

  return (
    <div className="page bears-page">
      <div className="bears-hdr">
        <h2 className="page-title">💀 Драуги — {clan.name}</h2>
        <div className="stat-pills">
          {active > 0 && <span className="pill pill-blue">⏱ {active} таймер{active > 1 ? 'а' : ''}</span>}
          {ready  > 0 && <span className="pill pill-green">⚡ {ready} спавн!</span>}
        </div>
      </div>
      <InfoSpoiler {...DRAUGS_SPOILER} storageKey="spoiler_draugs" />
      {error && <div className="error-msg">{error}</div>}

      <div className="tbl-wrap">
        {isMobile ? (
          <div className="bears-mobile-list" ref={mobileListRef}>
            {mergedDraugs.map(draug => (
              <DraugRow
                key={draug.draug_index}
                draug={draug}
                onKill={killDraug}
                onVanish={vanishDraug}
                onReset={resetDraug}
                onManualTime={handleManualTime}
              />
            ))}
          </div>
        ) : (
          <table className="bears-table">
            <thead>
              <tr>
                <th></th>
                <th>Название</th>
                <th>Квадрат</th>
                <th>До спавна</th>
                <th>Действия</th>
                <th>Время спавна</th>
                <th>Прошло времени</th>
                <th>Время смерти</th>
                <th>Игрок</th>
              </tr>
            </thead>
            <tbody>
              {mergedDraugs.map(draug => (
                <DraugRow
                  key={draug.draug_index}
                  draug={draug}
                  onKill={killDraug}
                  onVanish={vanishDraug}
                  onReset={resetDraug}
                  onManualTime={handleManualTime}
                />
              ))}
            </tbody>
          </table>
        )}
        <div className="tbl-timezone">
          ⏱ Часовой пояс: <span className="tbl-timezone-value">{userTimezone}</span>
        </div>
      </div>
      <div className="tbl-hint">
        ⚡ Звук за 5 мин до спавна · «Исчез» — драуг пропал ~5 мин назад · ✎ Нажми на «Время смерти» чтобы исправить
      </div>
    </div>
  );
}
