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
function ShiningSlot({ slot, gameTimeStr, slotIndex, onWarn }) {
  const [now, setNow] = useState(() => Date.now());
  const warnedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
    }, 500);
    return () => clearInterval(id);
  }, []);

  // msLeft > 0  → сияние ещё не наступило (считаем вниз)
  // msLeft <= 0 → сияние наступило, |msLeft| < DURATION → "горит", иначе "прошло"
  const msLeft     = slot.realAt - now;
  const isActive   = slotIndex === 0;
  const isBurning  = msLeft <= 0 && Math.abs(msLeft) < SHINING_DURATION_MS; // "горит" ~8 сек
  const isPast     = msLeft <= 0 && !isBurning;
  const isUpcoming = msLeft > 0;
  const isWarn     = isUpcoming && msLeft <= WARN_BEFORE_SHINING_MS;

  // Предупреждение за 5 мин
  useEffect(() => {
    if (isWarn && !warnedRef.current) {
      warnedRef.current = true;
      onWarn?.();
    }
    if (!isUpcoming) warnedRef.current = false;
  }, [isWarn, isUpcoming, onWarn]);

  // Игровое время этого слота
  const gameTime = getSlotGameTime(gameTimeStr, slotIndex);

  // Стиль карточки
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

  // Что показывать в таймере
  let timerLabel, timerValue, timerColor;
  if (isBurning && isActive) {
    timerLabel = 'Статус';
    timerValue = '⚡ РЕСП!';
    timerColor = '#50c878';
  } else if (isPast && isActive) {
    // Прошло — но слот 0 (активный) показывает сколько прошло
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
      flex: '1 1 180px', minWidth: 170,
      border: `1px solid ${borderColor}`,
      borderRadius: 10, background: bgColor,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color .3s, background .3s',
    }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className={dotClass} />
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: accentColor,
        }}>{LABELS[slotIndex]}</span>
      </div>

      {/* Игровое время */}
      <div>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Игровое время
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isActive ? 30 : 24,
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}>
          {gameTime}
        </div>
      </div>

      {/* Реальное время (когда наступит/наступило) */}
      <div>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Реальное время
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#8b949e' }}>
          {formatRealTime(slot.realAt)}
        </div>
      </div>

      {/* Таймер обратного отсчёта */}
      <div style={{ borderTop: '1px solid rgba(30,58,95,.3)', paddingTop: 8 }}>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {timerLabel}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isActive ? 22 : 17,
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

  // Глобальный тик для статус-строки
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const slots = shiningData?.anchorIso
    ? getUpcomingShiningSlots(shiningData.anchorIso, now)
    : null;

  function handleWarn() {
    playShiningWarningSound();
  }

  async function handleCommit({ gameTimeStr, locationId, anchorIso }) {
    const data = { anchorIso, locationId, gameTimeStr, setAt: new Date().toISOString() };
    onShiningChange(data);
    try { await api.post('/shining/set', data); } catch {}
  }

  const loc = getLocation(shiningData?.locationId || DEFAULT_LOCATION_ID);

  // Статус-строка (считается от слота 0)
  let statusPill = null;
  if (slots) {
    const msLeft  = slots[0].realAt - now;
    const burning = msLeft <= 0 && Math.abs(msLeft) < SHINING_DURATION_MS;
    if (burning) {
      statusPill = { color: '#50c878', text: '⚡ Сияние идёт прямо сейчас!' };
    } else if (msLeft > 0 && msLeft <= WARN_BEFORE_SHINING_MS) {
      statusPill = { color: '#e0a030', text: `⚠️ Сияние через ${formatShiningCountdown(msLeft)}!` };
    } else if (msLeft > 0) {
      statusPill = { color: '#4a9edd', text: `До ближайшего Сияния: ${formatShiningCountdown(msLeft)}` };
    } else {
      // Слот 0 прошёл, слот 1 — следующее
      const next = slots[1]?.realAt - now;
      statusPill = { color: '#4a9edd', text: `До следующего Сияния: ${next > 0 ? formatShiningCountdown(next) : '--:--'}` };
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {slots
          ? slots.map((slot, i) => (
              <ShiningSlot
                key={slot.index}
                slot={slot}
                gameTimeStr={shiningData?.gameTimeStr || '00:29'}
                slotIndex={i}
                onWarn={handleWarn}
              />
            ))
          : [0,1,2,3].map(i => (
              <div key={i} style={{
                flex: '1 1 180px', minWidth: 170,
                border: '1px solid #1a2535', borderRadius: 10,
                padding: '14px 16px', opacity: 0.4,
              }}>
                <div style={{ fontSize: 10, color: '#4a6a8a', textTransform: 'uppercase',
                  letterSpacing: '.07em', marginBottom: 10 }}>
                  {['Текущее / Активное','Следующее +1','Следующее +2','Следующее +3'][i]}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: '#1e2a3a' }}>--:--</div>
              </div>
            ))
        }
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
