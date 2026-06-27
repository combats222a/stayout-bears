import { useState, useEffect, useRef } from 'react';
import {
  DEFAULT_LOCATION_ID, getLocation,
  getLiveGameTime, isShiningActive, formatRealTime, formatCountdown,
  SHINING_INTERVAL_MS, SHINING_DURATION_MS, WARN_BEFORE_SHINING_MS,
  GAME_MINUTE_MS,
} from '../utils/shining';
import { playShiningWarningSound } from '../utils/sound';
import { api } from '../utils/api';

// ─── Модалка ввода якорей Z и X ──────────────────────────────────
function SetGameTimeModal({ onCommit, onClose }) {
  const [timeVal, setTimeVal] = useState('');
  const [error,   setError]   = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  function handleSubmit() {
    if (!timeVal.trim()) { setError('Введи игровое время'); return; }
    const parts = timeVal.trim().split(':').map(Number);
    if (parts.length < 2 || parts.some(isNaN)) { setError('Неверный формат. Пример: 01:13'); return; }
    const [gh, gm] = parts;
    if (gh < 0 || gh > 23 || gm < 0 || gm > 59) { setError('Неверное время'); return; }
    const anchorRealMs = Date.now();
    onCommit({ gameTimeStr: timeVal, locationId: DEFAULT_LOCATION_ID, anchorRealMs });
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
              Якорь Z — игровое время которое ты видишь прямо сейчас в игре
            </label>
            <input
              ref={inputRef}
              className="modal-input"
              value={timeVal}
              onChange={e => { setTimeVal(e.target.value); setError(''); }}
              onKeyDown={onKey}
              placeholder="01:13"
              autoComplete="off"
            />
            <div className="modal-hint">
              Любое текущее игровое время · Формат ЧЧ:ММ
            </div>
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

/**
 * Вычисляет 4 последовательных сияния начиная с текущего (или ближайшего).
 * Возвращает массив из 4 объектов:
 *   { realStartMs, realEndMs }
 *
 * Алгоритм:
 * 1. Текущее игровое время → в минутах
 * 2. Находим последний старт сияния (кратный 360 мин, <= текущих минут)
 * 3. realStart этого сияния = nowMs - (прошло игровых минут с последнего старта) * GAME_MINUTE_MS
 * 4. Если текущее сияние уже закончилось (прошло >= 60 игровых минут) → берём следующее
 * 5. Карточки 2-4 = карточка1.realStart + 1,2,3 * SHINING_INTERVAL_MS
 */
function computeShiningSlots(anchorGameTimeStr, anchorRealMs, nowMs) {
  const parts = (anchorGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const Z_minutes = gh * 60 + gm;

  // Текущие игровые минуты (без wrap, чтобы не терять направление)
  const elapsedRealMs = nowMs - anchorRealMs;
  const elapsedGameMinutes = elapsedRealMs / GAME_MINUTE_MS;
  const totalGameMinutes = Z_minutes + elapsedGameMinutes;
  const wrapped = ((totalGameMinutes % 1440) + 1440) % 1440;

  // Последний старт сияния (ближайший кратный 360 мин, <= wrapped)
  const lastShiningStartMin = Math.floor(wrapped / 360) * 360;
  const minutesSinceLastStart = wrapped - lastShiningStartMin;

  let slot0RealStart;
  if (minutesSinceLastStart < 60) {
    // Сияние сейчас активно — слот 0 = текущее сияние
    slot0RealStart = nowMs - minutesSinceLastStart * GAME_MINUTE_MS;
  } else {
    // Сияние не активно — слот 0 = следующее сияние
    const nextShiningStartMin = lastShiningStartMin + 360;
    const minutesUntilNext = nextShiningStartMin - wrapped;
    slot0RealStart = nowMs + minutesUntilNext * GAME_MINUTE_MS;
  }

  return Array.from({ length: 4 }, (_, i) => {
    const realStartMs = slot0RealStart + i * SHINING_INTERVAL_MS;
    const realEndMs = realStartMs + SHINING_DURATION_MS;
    return { realStartMs, realEndMs };
  });
}

// ─── Карточка одного сияния ───────────────────────────────────────
function ShiningCard({ cardIndex, realStartMs, realEndMs, anchorGameTimeStr, anchorRealMs, onWarn }) {
  const [now, setNow] = useState(() => Date.now());
  const burningRef    = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Текущее живое игровое время (одинаковое для всех карточек)
  const liveGameTime = getLiveGameTime(anchorGameTimeStr, anchorRealMs, 0, now);

  // Горит ли ЭТОТ слот сейчас
  const burning = now >= realStartMs && now < realEndMs;

  const msUntilStart = realStartMs - now;
  const msUntilEnd   = realEndMs - now;
  const isWarn = !burning && msUntilStart <= WARN_BEFORE_SHINING_MS && msUntilStart > 0;

  // Звук при начале сияния
  useEffect(() => {
    if (burning && !burningRef.current) onWarn?.();
    burningRef.current = burning;
  }, [burning, onWarn]);

  // ── Цвета ──
  let accentColor, borderColor, bgColor, dotColor;
  if (burning) {
    accentColor = '#50c878'; borderColor = 'rgba(80,200,120,.5)';
    bgColor = 'rgba(80,200,120,.07)'; dotColor = '#50c878';
  } else if (isWarn) {
    accentColor = '#e0a030'; borderColor = 'rgba(224,160,48,.4)';
    bgColor = 'rgba(224,160,48,.06)'; dotColor = '#e0a030';
  } else if (cardIndex === 0) {
    accentColor = '#4a9edd'; borderColor = '#1e3a5f';
    bgColor = 'rgba(74,158,221,.04)'; dotColor = '#4a9edd';
  } else {
    accentColor = '#4a6a8a'; borderColor = '#1a2535';
    bgColor = 'transparent'; dotColor = '#4a6a8a';
  }

  const CARD_LABELS = ['СИЯНИЕ 1', 'СИЯНИЕ 2', 'СИЯНИЕ 3', 'СИЯНИЕ 4'];

  // ── Таймер ──
  let timerLabel, timerValue, timerColor;
  if (burning) {
    timerLabel = 'До конца';
    timerValue = msUntilEnd > 0 ? formatCountdown(msUntilEnd) : '00:00';
    timerColor = '#50c878';
  } else {
    timerLabel = 'Через';
    timerValue = msUntilStart > 0 ? formatCountdown(msUntilStart) : '00:00';
    timerColor = isWarn ? '#e0a030' : (cardIndex === 0 ? '#4a9edd' : '#6e8090');
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
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: dotColor, flexShrink: 0,
          boxShadow: burning ? `0 0 6px ${dotColor}` : 'none',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: accentColor,
        }}>{CARD_LABELS[cardIndex]}</span>
      </div>

      {/* Игровое время — тикает, одинаково для всех */}
      <div>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Игровое время
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700,
          color: accentColor, letterSpacing: '0.04em', lineHeight: 1,
        }}>
          {liveGameTime}
        </div>
      </div>

      {/* Реальное время начала ЭТОГО сияния */}
      <div>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {burning ? 'Началось в' : 'Начало в'}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, color: '#8b949e' }}>
          {formatRealTime(realStartMs)}
        </div>
      </div>

      {/* Таймер */}
      <div style={{ borderTop: '1px solid rgba(30,58,95,.3)', paddingTop: 8 }}>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {timerLabel}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: timerColor }}>
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  function handleWarn() { playShiningWarningSound(); }

  async function handleCommit({ gameTimeStr, locationId, anchorRealMs }) {
    const data = {
      gameTimeStr,
      locationId,
      anchorRealMs,
      anchorIso: new Date(anchorRealMs).toISOString(),
      setAt: new Date().toISOString(),
    };
    onShiningChange(data);
    try { await api.post('/shining/set', data); } catch {}
  }

  const loc = getLocation(shiningData?.locationId || DEFAULT_LOCATION_ID);
  const hasData = shiningData?.gameTimeStr && shiningData?.anchorRealMs;

  // Вычисляем 4 слота (обновляется каждые 500мс через now)
  const slots = hasData
    ? computeShiningSlots(shiningData.gameTimeStr, shiningData.anchorRealMs, now)
    : null;

  // Статус-строка
  let statusPill = null;
  if (slots) {
    const slot0 = slots[0];
    const burning = now >= slot0.realStartMs && now < slot0.realEndMs;
    if (burning) {
      statusPill = { color: '#50c878', text: '⚡ Сияние идёт прямо сейчас!' };
    } else {
      const msUntilNext = slot0.realStartMs - now;
      if (msUntilNext <= WARN_BEFORE_SHINING_MS) {
        statusPill = { color: '#e0a030', text: `⚠️ Сияние через ${formatCountdown(msUntilNext)}!` };
      } else {
        statusPill = { color: '#4a9edd', text: `До ближайшего Сияния: ${formatCountdown(msUntilNext)}` };
      }
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
          {hasData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#c8d6e5' }}>
                Якорь Z (игровое):{' '}
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
                {' · Якорь X (реальное): '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#4a6a8a' }}>
                  {formatRealTime(shiningData.anchorRealMs)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#8b949e' }}>
              Введи текущее игровое время чтобы начать отсчёт
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

      {/* 4 карточки СИЯНИЕ 1-4 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {hasData && slots
          ? slots.map((slot, i) => (
              <ShiningCard
                key={i}
                cardIndex={i}
                realStartMs={slot.realStartMs}
                realEndMs={slot.realEndMs}
                anchorGameTimeStr={shiningData.gameTimeStr}
                anchorRealMs={shiningData.anchorRealMs}
                onWarn={handleWarn}
              />
            ))
          : [0, 1, 2, 3].map(i => (
              <div key={i} style={{
                flex: '1 1 180px', minWidth: 170,
                border: '1px solid #1a2535', borderRadius: 10,
                padding: '14px 16px', opacity: 0.4,
              }}>
                <div style={{ fontSize: 10, color: '#4a6a8a', textTransform: 'uppercase',
                  letterSpacing: '.07em', marginBottom: 10 }}>
                  {['СИЯНИЕ 1','СИЯНИЕ 2','СИЯНИЕ 3','СИЯНИЕ 4'][i]}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: '#1e2a3a' }}>--:--</div>
              </div>
            ))
        }
      </div>

      {/* Подсказка */}
      <div className="tbl-hint">
        ✨ Сияния каждые 6 игровых часов = 52 мин 30 сек реального времени ·
        Диапазоны: 00:00–01:00 · 06:00–07:00 · 12:00–13:00 · 18:00–19:00 ·
        Звук за 5 мин · Любой игрок клана может обновить время
      </div>

      {showModal && (
        <SetGameTimeModal
          onCommit={handleCommit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
