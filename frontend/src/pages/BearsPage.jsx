import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import {
  BEARS_LIST, getBearMeta, getBearStatus,
  getTimeLeftMs, formatCountdown, formatClock, formatElapsed, getProgress,
  parseLocalTimeInput, killedAtFromSpawnAt
} from '../utils/bears';
import { playSpawnSound } from '../utils/sound';

const WARN_BEFORE_SPAWN_MS = 5 * 60 * 1000;

// ── Modal for entering kill time ─────────────────────────────────────────────
function KillTimeModal({ bearName, onCommit, onClose }) {
  const [value, setValue] = useState('');
  const [error, setError]  = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Pre-fill with current local time
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    setValue(`${hh}:${mm}:${ss}`);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  function handleSubmit() {
    const iso = parseLocalTimeInput(value);
    if (!iso) { setError('Введи время в формате ЧЧ:ММ или ЧЧ:ММ:СС'); return; }
    onCommit(iso);
    onClose();
  }

  function onKey(e) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⏱ Время смерти — <span className="modal-bear-name">{bearName}</span></div>
        <div className="modal-body">
          <label className="modal-label">Введи время когда убили медведя</label>
          <input
            ref={inputRef}
            className="modal-input"
            value={value}
            onChange={e => { setValue(e.target.value); setError(''); }}
            onKeyDown={onKey}
            placeholder="09:35:00"
            autoComplete="off"
          />
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-hint">Формат: ЧЧ:ММ или ЧЧ:ММ:СС · Время твоего часового пояса</div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="modal-btn-ok" onClick={handleSubmit}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── Bear row ────────────────────────────────────────────────────────────────
function BearRow({ bear, onKill, onVanish, onReset, onManualTime }) {
  const [ms, setMs]     = useState(() => getTimeLeftMs(bear));
  const [elap, setElap] = useState('--:--:--');
  const [showModal, setShowModal] = useState(false);
  const warnedRef = useRef(getTimeLeftMs(bear) <= WARN_BEFORE_SPAWN_MS);

  useEffect(() => {
    setMs(getTimeLeftMs(bear));
    warnedRef.current = getTimeLeftMs(bear) <= WARN_BEFORE_SPAWN_MS;
  }, [bear]);

  useEffect(() => {
    const id = setInterval(() => {
      const left = getTimeLeftMs(bear);
      setMs(left);
      setElap(formatElapsed(bear.killed_at));
      if (bear.spawn_at && left > 0 && left <= WARN_BEFORE_SPAWN_MS && !warnedRef.current) {
        warnedRef.current = true;
        playSpawnSound();
      }
    }, 500);
    return () => clearInterval(id);
  }, [bear]);

  const isDead    = getBearStatus(bear) === 'dead';
  const isReady   = bear.spawn_at && !isDead;
  const isWarning = isDead && ms <= 60_000;
  const meta      = getBearMeta(bear.bear_index);
  const pct       = getProgress(bear);
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

  const spawnDisplay  = formatClock(bear.spawn_at);
  const killedDisplay = formatClock(bear.killed_at);

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
                  <button className="btn-now"  onClick={() => onKill(bear.bear_index)}>Сейчас</button>
                  <button className="btn-gone" onClick={() => onVanish(bear.bear_index)}>Исчез</button>
                </>
              : <button className="btn-reset-row" onClick={() => onReset(bear.bear_index)}>✕ Сброс</button>
            }
          </div>
        </td>

        {/* Время спавна — только отображение */}
        <td className="td-clock">{isActive ? spawnDisplay : '--:--:--'}</td>

        {/* Прошло времени — только отображение, тикает */}
        <td className="td-clock">{isActive ? elap : '--:--:--'}</td>

        {/* Время смерти — кликабельное, открывает модалку */}
        <td>
          {isActive
            ? <span
                className="td-clock clock-editable"
                title="Нажми чтобы исправить время смерти"
                onClick={() => setShowModal(true)}
              >
                {killedDisplay} ✎
              </span>
            : <span
                className="td-clock clock-editable clock-empty"
                title="Нажми чтобы ввести время смерти"
                onClick={() => setShowModal(true)}
              >
                --:--:-- ✎
              </span>
          }
        </td>

        <td className="td-user">{bear.killer_nick || '—'}</td>
      </tr>

      {showModal && (
        <KillTimeModal
          bearName={meta.name}
          onCommit={iso => onManualTime(bear.bear_index, iso)}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function BearsPage({ bears, clan, onBearChange }) {
  const [error, setError] = useState('');

  const mergedBears = BEARS_LIST.map(meta => {
    const found = bears.find(b => b.bear_index === meta.index);
    return found || { bear_index: meta.index, spawn_at: null, killed_at: null, killer_nick: null };
  });

  const active = mergedBears.filter(b => getBearStatus(b) === 'dead').length;
  const ready  = mergedBears.filter(b => b.spawn_at && getBearStatus(b) === 'alive').length;

  async function killBear(index, killedAt) {
    setError('');
    try {
      const body = killedAt ? { killed_at: killedAt } : {};
      const { bear } = await api.post(`/bears/${index}/kill`, body);
      onBearChange({ ...bear });
    } catch (e) { setError(e.message); }
  }

  async function vanishBear(index) {
    const killedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await killBear(index, killedAt);
  }

  async function resetBear(index) {
    setError('');
    try {
      const { bear } = await api.post(`/bears/${index}/reset`);
      onBearChange({ ...bear });
    } catch (e) { setError(e.message); }
  }

  async function handleManualTime(index, killedAtIso) {
    await killBear(index, killedAtIso);
  }

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">Медведи</h2>
        <div className="empty-state"><p>Вступи в клан чтобы отслеживать медведей</p></div>
      </div>
    );
  }

  return (
    <div className="page bears-page">
      <div className="bears-hdr">
        <h2 className="page-title">🐻‍❄️ Белые медведи — {clan.name}</h2>
        <div className="stat-pills">
          {active > 0 && <span className="pill pill-blue">⏱ {active} таймер{active > 1 ? 'а' : ''}</span>}
          {ready  > 0 && <span className="pill pill-green">⚡ {ready} спавн!</span>}
        </div>
      </div>
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
              <th>Время смерти ✎</th>
              <th>Игрок</th>
            </tr>
          </thead>
          <tbody>
            {mergedBears.map(bear => (
              <BearRow
                key={bear.bear_index}
                bear={bear}
                onKill={killBear}
                onVanish={vanishBear}
                onReset={resetBear}
                onManualTime={handleManualTime}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="tbl-hint">
        ⚡ Звук за 5 мин до спавна · «Исчез» — медведь пропал ~5 мин назад · ✎ Нажми на «Время смерти» чтобы исправить
      </div>
    </div>
  );
}
