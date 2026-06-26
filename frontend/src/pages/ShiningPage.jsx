import { useState, useEffect, useRef } from 'react';
import {
  LOCATIONS, DEFAULT_LOCATION_ID, getLocation,
  parseGameTimeInput, getUpcomingShiningSlots,
  formatRealTime, formatShiningCountdown,
  getSlotGameTime,
  WARN_BEFORE_SHINING_MS, SHINING_DURATION_MS,
} from '../utils/shining';
import { playShiningWarningSound } from '../utils/sound';
import { api } from '../utils/api';

// ─── Модалка ─────────────────────────────────────────────────────
function SetGameTimeModal({ onCommit, onClose, currentLocationId }) {
  const [timeVal, setTimeVal] = useState('');
  const [locId,   setLocId]   = useState(currentLocationId || DEFAULT_LOCATION_ID);
  const [error,   setError]   = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  function handleSubmit() {
    if (!timeVal.trim()) { setError('Введи игровое время'); return; }
    const iso = parseGameTimeInput(timeVal, locId);
    if (!iso) { setError('Неверный формат. Пример: 06:29'); return; }
    onCommit({ gameTimeStr: timeVal, locationId: locId, anchorIso: iso });
    onClose();
  }

  function onKey(e) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-title">✨ Установить время Горы Сияния</div>
        <div className="modal-body" style={{ gap: 18 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="modal-label">
              Игровое время текущего Сияния (которое видишь сейчас в игре)
            </label>
            <input
              ref={inputRef}
              className="modal-input"
              value={timeVal}
              onChange={e => { setTimeVal(e.target.value); setError(''); }}
              onKeyDown={onKey}
              placeholder="17:26"
              autoComplete="off"
            />
            <div className="modal-hint">
              Сияния в игровое время: 00:29 · 06:29 · 12:29 · 18:29 · Формат ЧЧ:ММ
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="modal-label">Локация (игровой часовой пояс)</label>
            {LOCATIONS.map(l => {
              const active = locId === l.id;
              return (
                <label key={l.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${active ? '#58a6ff' : '#30363d'}`,
                  background: active ? 'rgba(88,166,255,0.08)' : 'transparent',
                  transition: 'all .15s',
                }}>
                  <input type="radio" name="loc" value={l.id}
                    checked={active} onChange={() => setLocId(l.id)}
                    style={{ marginTop: 3, accentColor: '#58a6ff' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: active ? '#58a6ff' : '#e6edf3' }}>
                      {l.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{l.name}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="modal-btn-ok" onClick={handleSubmit}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ─── Карточка одного слота ───────────────────────────────────────
function ShiningSlot({ slot, gameTimeStr, slotIndex }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
    }, 500);
    return () => clearInterval(id);
  }, []);

  const msLeft     = slot.realAt - now;
  const isActive   = slotIndex === 0;
  const isBurning  = msLeft <= 0 && Math.abs(msLeft) < SHINING_DURATION_MS;
  const isPast     = msLeft <= 0 && !isBurning;
  const isUpcoming = msLeft > 0;
  const isWarn     = isUpcoming && msLeft <= WARN_BEFORE_SHINING_MS;

  const gameTime = getSlotGameTime(gameTimeStr, slotIndex);

  let accentColor, borderColor, bgColor, dotClass;
  if (isActive) {
    if (isBurning) {
      accentColor = '#50c878'; borderColor = 'rgba(80,200,120,.5)';
      bgColor = 'rgba(80,200,120,.07)'; dotClass = 'sdot sdot-green';
    } else if (isWarn) {
      accentColor = '#e0a030'; borderColor = 'rgba(224,160,48,.4)';
      bgColor = 'rgba(224,160,48,.06)'; dotClass = 'sdot sdot-orange';
    } else {
      accentColor = '#4a9edd'; borderColor = '#1e3a5f';
      bgColor = 'rgba(74,158,221,.04)'; dotClass = 'sdot sdot-blue';
    }
  } else {
    accentColor = '#4a6a8a'; borderColor = '#1a2535';
    bgColor = 'transparent'; dotClass = 'sdot';
  }

  const LABELS = ['Текущее / Активное', 'Следующее +1', 'Следующее +2', 'Следующее +3'];

  let timerLabel, timerValue, timerColor;
  if (isBurning && isActive) {
    timerLabel = 'Статус';
    timerValue = '⚡ РЕСП!';
    timerColor = '#50c878';
  } else if (isPast && isActive) {
    timerLabel = 'Прошло';
    timerValue = formatShiningCountdown(Math.abs(msLeft));
    timerColor = '#3a5a7a';
  } else if (isUpcoming) {
    timerLabel = isActive ? 'До Сияния' : 'Через';
    timerValue = formatShiningCountdown(msLeft);
    timerColor = isWarn ? '#e0a030' : (isActive ? '#4a9edd' : '#6e8090');
  } else {
    timerLabel = 'Прошло';
    timerValue = '+' + formatShiningCountdown(Math.abs(msLeft));
    timerColor = '#2a3a4a';
  }

  return (
    <div style={{
      flex: '1 1 0', minWidth: 0,
      border: `1px solid ${borderColor}`,
      borderRadius: 10, background: bgColor,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color .3s, background .3s',
    }}>
      {/* Заголовок — фиксированная высота */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 22, marginBottom: 10 }}>
        <span className={dotClass} />
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: accentColor,
        }}>{LABELS[slotIndex]}</span>
      </div>

      {/* Игровое время — фиксированная высота */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#6e7681', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Игровое время
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 38,
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '0.04em',
          lineHeight: 1,
          height: 38,
          display: 'flex', alignItems: 'center',
        }}>
          {gameTime}
        </div>
      </div>

      {/* Реальное время — фиксированная высота */}
      <div style={{ marginBottom: 12, height: 42 }}>
        <div style={{ fontSize: 10, color: '#6e7681', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Реальное время
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: '#8b949e' }}>
          {formatRealTime(slot.realAt)}
        </div>
      </div>

      {/* Таймер — фиксированная высота */}
      <div style={{ borderTop: '1px solid rgba(30,58,95,.3)', paddingTop: 10 }}>
        <div style={{ fontSize: 10, color: '#6e7681', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {timerLabel}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 26,
          fontWeight: 700,
          color: timerColor,
        }}>
          {timerValue}
        </div>
      </div>
    </div>
  );
}

// ─── Основная страница ───────────────────────────────────────────
export default function ShiningPage({ clan, shiningData, onShiningChange }) {
  const [showModal, setShowModal] = useState(false);
  const [now, setNow]             = useState(() => Date.now());
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const slots = shiningData?.anchorIso
    ? getUpcomingShiningSlots(shiningData.anchorIso, now)
    : null;

  // Звук: следим за следующим сиянием (слот 1) — когда до него ≤5 мин реального времени
  const warnedRef = useRef(false);
  useEffect(() => {
    if (!slots) return;
    const msToNext = slots[1].realAt - now;
    const inWarnZone = msToNext > 0 && msToNext <= WARN_BEFORE_SHINING_MS;
    if (inWarnZone && !warnedRef.current) {
      warnedRef.current = true;
      playShiningWarningSound();
    }
    if (!inWarnZone) {
      warnedRef.current = false;
    }
  });

  async function handleCommit({ gameTimeStr, locationId, anchorIso }) {
    const data = { anchorIso, locationId, gameTimeStr, setAt: new Date().toISOString() };
    onShiningChange(data);
    try { await api.post('/shining/set', data); } catch {}
  }

  const loc = getLocation(shiningData?.locationId || DEFAULT_LOCATION_ID);

  let statusPill = null;
  if (slots) {
    const msLeft  = slots[0].realAt - now;
    const burning = msLeft <= 0 && Math.abs(msLeft) < SHINING_DURATION_MS;
    const msToNext = slots[1].realAt - now;
    if (burning) {
      statusPill = { color: '#50c878', text: '⚡ Сияние идёт прямо сейчас!' };
    } else if (msToNext > 0 && msToNext <= WARN_BEFORE_SHINING_MS) {
      statusPill = { color: '#e0a030', text: `⚠️ Сияние через ${formatShiningCountdown(msToNext)}!` };
    } else {
      statusPill = { color: '#4a9edd', text: `До следующего Сияния: ${msToNext > 0 ? formatShiningCountdown(msToNext) : '--:--'}` };
    }
  }

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">✨ Гора Сияния</h2>
        <div className="empty-state"><p>Вступи в клан чтобы отслеживать Сияния</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Заголовок */}
      <div className="bears-hdr">
        <h2 className="page-title">✨ Гора Сияния — {clan.name}</h2>
        <div className="stat-pills">
          {statusPill && (
            <span className="pill" style={{
              color: statusPill.color,
              borderColor: statusPill.color,
              background: `${statusPill.color}18`,
            }}>
              {statusPill.text}
            </span>
          )}
        </div>
      </div>

      {/* Инфо-панель */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '12px 16px',
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          {shiningData?.anchorIso ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#c8d6e5' }}>
                Введено игровое время:{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#58a6ff', fontWeight: 700 }}>
                  {shiningData.gameTimeStr}
                </span>
                {' · '}
                <span style={{ color: '#50c878' }}>{loc.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#6e7681' }}>
                {loc.name}
                {shiningData.setByNick && (
                  <> · Установил: <span style={{ color: '#8b949e' }}>{shiningData.setByNick}</span></>
                )}
                {' · Реальное время якоря: '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#4a6a8a' }}>
                  {formatRealTime(new Date(shiningData.anchorIso).getTime())}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#8b949e' }}>
              Введи игровое время текущего Сияния чтобы начать отсчёт
            </div>
          )}
        </div>
        <button className="modal-btn-ok"
          style={{ padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setShowModal(true)}
        >
          ✨ Установить время
        </button>
      </div>

      {/* 4 карточки */}
      <div style={{ display: 'flex', gap: 10 }}>
        {slots
          ? slots.map((slot, i) => (
              <ShiningSlot
                key={slot.index}
                slot={slot}
                gameTimeStr={shiningData?.gameTimeStr || '00:29'}
                slotIndex={i}
              />
            ))
          : [0,1,2,3].map(i => (
              <div key={i} style={{
                flex: '1 1 0', minWidth: 0,
                border: '1px solid #1a2535', borderRadius: 10,
                padding: '14px 16px', opacity: 0.4,
              }}>
                <div style={{ fontSize: 11, color: '#4a6a8a', textTransform: 'uppercase',
                  letterSpacing: '.07em', marginBottom: 12 }}>
                  {['Текущее / Активное','Следующее +1','Следующее +2','Следующее +3'][i]}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 38, color: '#1e2a3a' }}>--:--</div>
              </div>
            ))
        }
      </div>

      {/* Часовой пояс — как на странице медведей */}
      <div className="tbl-timezone">
        ⏱ Часовой пояс: <span className="tbl-timezone-value">{userTimezone}</span>
      </div>

      {/* Подсказка */}
      <div className="tbl-hint">
        ✨ Сияния каждые 6 игровых часов = 52 мин 30 сек реального времени ·
        Игровые метки: 00:29 · 06:29 · 12:29 · 18:29 ·
        Звук за 5 мин · Любой игрок клана может обновить время
      </div>

      {showModal && (
        <SetGameTimeModal
          currentLocationId={shiningData?.locationId || DEFAULT_LOCATION_ID}
          onCommit={handleCommit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
