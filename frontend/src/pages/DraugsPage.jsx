import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import {
  DRAUGS_LIST, getDraugMeta, getDraugStatus,
  getTimeLeftMs, formatCountdown, formatClock, formatElapsed, getProgress,
  parseLocalTimeInput, killedAtFromSpawnAt, WARN_BEFORE_SPAWN_MS
} from '../utils/draugs';
import { isDraugSoundEnabled, setDraugSoundEnabled } from '../utils/soundPrefs';
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
  const [ms, setMs]     = useState(() => getTimeLeftMs(draug));
  const [elap, setElap] = useState('--:--:--');
  const [showModal, setShowModal] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isDraugSoundEnabled(draug.draug_index));
  const warnedRef = useRef(getTimeLeftMs(draug) <= WARN_BEFORE_SPAWN_MS);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setDraugSoundEnabled(draug.draug_index, next);
  }

  useEffect(() => {
    setMs(getTimeLeftMs(draug));
    warnedRef.current = getTimeLeftMs(draug) <= WARN_BEFORE_SPAWN_MS;
  }, [draug]);

  useEffect(() => {
    // Небольшой случайный сдвиг старта, чтобы тики всех строк таблицы
    // не совпадали на один и тот же кадр (иначе на слабых GPU это даёт
    // залповую перерисовку сразу всех прогресс-баров и глючит рендер).
    const offset = Math.floor(Math.random() * 500);
    let id;
    const timeoutId = setTimeout(() => {
      id = setInterval(() => {
        const left = getTimeLeftMs(draug);
        setMs(left);
        setElap(formatElapsed(draug.killed_at));
        if (draug.spawn_at && left > 0 && left <= WARN_BEFORE_SPAWN_MS && !warnedRef.current) {
          // Звук проигрывает только глобальный вотчер (useGlobalSoundWatcher),
          // чтобы не срабатывать дважды, пока пользователь на вкладке "Драуги".
          warnedRef.current = true;
        }
      }, 500);
    }, offset);
    return () => { clearTimeout(timeoutId); clearInterval(id); };
  }, [draug]);

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

  return (
    <>
      {/* Desktop table row */}
      <tr className={`${rowCls} bear-row-desktop`}>
        <td><span className={dotCls} /></td>
        <td className="td-name">{meta.name}</td>
        <td><span className="square-badge">{meta.square}</span></td>
        <td className="td-timer">
          {isReady
            ? <span className="spawn-tag">⚡ Спавн!</span>
            : <div className="prog-wrap">
                <div className="prog-bar">
                  <div className="prog-fill" style={{ transform: `scaleX(${pct})`, background: barColor }} />
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

      {/* Mobile card row */}
      <tr className={`${rowCls} bear-row-mobile`}>
        <td colSpan={9} style={{ padding: 0 }}>
          <div className="bear-mobile-card">
            <div className="bear-mobile-header">
              <span className={dotCls} />
              <span className="bear-mobile-name">{meta.name}</span>
              <span className="square-badge" style={{ marginLeft: 'auto' }}>{meta.square}</span>
            </div>
            <div className="bear-mobile-timer">
              {isReady
                ? <span className="spawn-tag">⚡ Спавн!</span>
                : <div
                    className="prog-wrap"
                    onClick={() => setShowModal(true)}
                    style={{ cursor: 'pointer' }}
                    title={isDead ? 'Нажми чтобы исправить время смерти' : 'Нажми чтобы ввести время смерти'}
                  >
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ transform: `scaleX(${pct})`, background: barColor }} />
                    </div>
                    <span
                      className={`timer-val clock-editable${isDead ? '' : ' clock-empty'}`}
                      style={isDead ? { color: timerColor } : undefined}
                    >
                      {isDead ? formatCountdown(ms) : '--:--'}<span className="edit-icon"> ✎</span>
                    </span>
                  </div>
              }
            </div>
            {isActive && (
              <div className="bear-mobile-meta">
                <span>🕐 Смерть:&nbsp;
                  <span className="clock-editable" onClick={() => setShowModal(true)}>
                    {killedDisplay} <span className="edit-icon">✎</span>
                  </span>
                </span>
                <span>⚡ Спавн: {spawnDisplay}</span>
                <span>⏳ Прошло: {isDead ? elap : '--:--:--'}</span>
                {draug.killer_nick && <span>👤 {draug.killer_nick}</span>}
              </div>
            )}
            <div className="bear-mobile-actions">
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
        </td>
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
