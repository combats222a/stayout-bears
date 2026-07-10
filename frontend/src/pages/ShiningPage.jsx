import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_LOCATION_ID, getLocation,
  getLiveGameTime, isShiningActive, formatRealTime, formatCountdown,
  SHINING_INTERVAL_MS, SHINING_DURATION_MS, WARN_BEFORE_SHINING_MS,
  computeShiningSlots,
} from '../utils/shining';
import { playShiningWarningSound } from '../utils/sound';
import { isShiningSoundEnabled, setShiningSoundEnabled } from '../utils/soundPrefs';
import MaskedTimeInput, { digitsToTimeStr } from '../components/MaskedTimeInput';
import InfoSpoiler from '../components/InfoSpoiler';
import GuestLock from '../components/GuestLock';
import { SHINING_SPOILER } from '../content/spoilerContent';
import { api } from '../utils/api';

// ─── Модалка ввода якорей Z и X ──────────────────────────────────
function SetGameTimeModal({ onCommit, onClose }) {
  const [digits, setDigits] = useState('');
  const [error,  setError]  = useState('');

  function handleSubmit() {
    if (!digits) { setError('Введи игровое время — просто цифры, например 0113'); return; }
    const timeStr = digitsToTimeStr(digits, 2);
    const [gh, gm] = timeStr.split(':').map(Number);
    if (gh < 0 || gh > 23 || gm < 0 || gm > 59) { setError('Неверное время'); return; }
    const anchorRealMs = Date.now();
    onCommit({ gameTimeStr: timeStr, locationId: DEFAULT_LOCATION_ID, anchorRealMs });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-title">✨ Установить время Горы Сияния</div>
        <div className="modal-body" style={{ gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="modal-label">
              Якорь Z — игровое время которое ты видишь прямо сейчас в игре (только цифры)
            </label>
            <MaskedTimeInput
              segments={2}
              value={digits}
              onChange={d => { setDigits(d); setError(''); }}
              onEnter={handleSubmit}
              placeholder="01:13"
              autoFocus
            />
            <div className="modal-hint">
              Просто вводи цифры — двоеточие появится само · Любое текущее игровое время
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

// ─── Карточка одного сияния ───────────────────────────────────────
function ShiningCard({ cardIndex, realStartMs, realEndMs, anchorGameTimeStr, anchorRealMs, onWarn }) {
  const [now, setNow] = useState(() => Date.now());
  // Как у медведей: реф инициализируем РЕАЛЬНЫМ текущим состоянием,
  // а не false — иначе при заходе на вкладку/пересоздании карточки
  // звук может ложно сыграть сразу вместо того чтобы сыграть строго
  // в момент перехода "не горит" → "горит".
  const burningRef = useRef(Date.now() >= realStartMs && Date.now() < realEndMs);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Ресинхронизация рефа если слот сдвинулся (якорь Z/X переустановили) —
  // аналог эффекта на [bear] у медведей.
  useEffect(() => {
    burningRef.current = Date.now() >= realStartMs && Date.now() < realEndMs;
  }, [realStartMs, realEndMs]);

  // Текущее живое игровое время (одинаковое для всех карточек)
  const liveGameTime = getLiveGameTime(anchorGameTimeStr, anchorRealMs, 0, now);

  // Горит ли ЭТОТ слот сейчас
  const burning = now >= realStartMs && now < realEndMs;

  const msUntilStart = realStartMs - now;
  const msUntilEnd   = realEndMs - now;
  const isWarn = !burning && msUntilStart <= WARN_BEFORE_SHINING_MS && msUntilStart > 0;

  // Звук ровно в момент достижения игрового времени 00:00/06:00/12:00/18:00
  // (переход false → true), точно так же как у медведей — по абсолютному
  // времени, а не по "тику" интервала, поэтому переживает фон/сворачивание вкладки.
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
export default function ShiningPage({ clan, shiningData, onShiningChange, isGuest, onLoginClick }) {
  const [showModal, setShowModal] = useState(false);
  const [now, setNow]             = useState(() => Date.now());
  const [soundOn, setSoundOn]     = useState(() => isShiningSoundEnabled());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setShiningSoundEnabled(next);
  }

  const handleWarn = useCallback(() => {
    if (isShiningSoundEnabled()) playShiningWarningSound();
  }, []);

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
        <InfoSpoiler {...SHINING_SPOILER} storageKey="spoiler_shining" />
        {isGuest ? (
          <GuestLock
            icon="✨"
            title="Не пропускай Сияние на Горе"
            text="Точный отсчёт до ближайшего цикла и звуковое уведомление доступны кланам Bear Tracker — зарегистрируйся, чтобы подключиться."
            onLoginClick={onLoginClick}
          />
        ) : (
          <div className="empty-state"><p>Вступи в клан чтобы отслеживать Сияния</p></div>
        )}
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
          <button
            className={`rupor-btn ${soundOn ? 'rupor-on' : 'rupor-off'}`}
            onClick={toggleSound}
            title={soundOn ? 'Звук включён — нажми чтобы выключить' : 'Звук выключен — нажми чтобы включить'}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      <InfoSpoiler {...SHINING_SPOILER} storageKey="spoiler_shining" />

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
