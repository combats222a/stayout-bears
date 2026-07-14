import { useState, useEffect } from 'react';
import {
  computeAnomalySlots, loadAnomalyAnchor, saveAnomalyAnchor,
} from '../utils/anomaly';
import { formatRealTime, formatCountdown } from '../utils/shining';
import { isAnomalySoundEnabled, setAnomalySoundEnabled } from '../utils/soundPrefs';
import SoundIcon from '../components/SoundIcon';
import InfoSpoiler from '../components/InfoSpoiler';
import MaskedTimeInput, { digitsToTimeStr } from '../components/MaskedTimeInput';
import { ANOMALY_SPOILER } from '../content/spoilerContent';

// ─── Модалка ввода якоря Z (декоративная — на расписание не влияет) ─
function SetAnomalyTimeModal({ onCommit, onClose }) {
  const [digits, setDigits] = useState('');
  const [error,  setError]  = useState('');

  function handleSubmit() {
    if (!digits) { setError('Введи игровое время — просто цифры, например 0113'); return; }
    const timeStr = digitsToTimeStr(digits, 2);
    const [gh, gm] = timeStr.split(':').map(Number);
    if (gh < 0 || gh > 23 || gm < 0 || gm > 59) { setError('Неверное время'); return; }
    onCommit({ gameTimeStr: timeStr, anchorRealMs: Date.now() });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-title">🥶 Установить время Уледной жары</div>
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
              Backspace удаляет время справа налево: минуты → часы. Затем просто вводи цифры — двоеточие появится само ·
              Расписание прорывов всегда идёт по реальному GMT+00:00 и от этого значения не зависит
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

// ─── Карточка одного окна прорыва ──────────────────────────────────
function AnomalyCard({ cardIndex, warnStartMs, realStartMs, realEndMs }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const burning = now >= realStartMs && now < realEndMs;
  const msUntilStart = realStartMs - now;
  const msUntilEnd   = realEndMs - now;
  const isWarn = now >= warnStartMs && now < realStartMs;

  // ── Цвета ──
  // Отличие от Горы Сияния: ближайшее окно (cardIndex === 0), пока оно ещё
  // не в предупреждении и не активно, подсвечивается жёлтым (а не синим).
  let accentColor, borderColor, bgColor, dotColor;
  if (burning) {
    accentColor = '#50c878'; borderColor = 'rgba(80,200,120,.5)';
    bgColor = 'rgba(80,200,120,.07)'; dotColor = '#50c878';
  } else if (isWarn) {
    accentColor = '#e0a030'; borderColor = 'rgba(224,160,48,.4)';
    bgColor = 'rgba(224,160,48,.06)'; dotColor = '#e0a030';
  } else if (cardIndex === 0) {
    accentColor = '#e0c930'; borderColor = 'rgba(224,201,48,.4)';
    bgColor = 'rgba(224,201,48,.05)'; dotColor = '#e0c930';
  } else {
    accentColor = '#4a6a8a'; borderColor = '#1a2535';
    bgColor = 'transparent'; dotColor = '#4a6a8a';
  }

  const CARD_LABELS = ['ПРОРЫВ 1', 'ПРОРЫВ 2', 'ПРОРЫВ 3', 'ПРОРЫВ 4'];

  // ── Таймер ──
  let timerLabel, timerValue, timerColor;
  if (burning) {
    timerLabel = 'До конца';
    timerValue = msUntilEnd > 0 ? formatCountdown(msUntilEnd) : '00:00';
    timerColor = '#50c878';
  } else {
    timerLabel = 'Через';
    timerValue = msUntilStart > 0 ? formatCountdown(msUntilStart) : '00:00';
    timerColor = isWarn ? '#e0a030' : (cardIndex === 0 ? '#e0c930' : '#6e8090');
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

      {/* Реальное время начала окна (GMT+00:00) */}
      <div>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {burning ? 'Началось в' : 'Начало в'}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700,
          color: accentColor, letterSpacing: '0.04em', lineHeight: 1,
        }}>
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
// Не связана с «Горой Сияния»: не использует якорь/игровое время,
// расписание фиксировано по реальному GMT+00:00 и одинаково для всех,
// поэтому доступна без клана/входа — как Захваты и Калькулятор времени.
export default function AnomalyPage({ user }) {
  const [now, setNow]     = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(() => isAnomalySoundEnabled());
  const [showModal, setShowModal] = useState(false);
  const [anchor, setAnchor] = useState(() => loadAnomalyAnchor());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setAnomalySoundEnabled(next);
  }

  function handleCommit({ gameTimeStr, anchorRealMs }) {
    const next = {
      gameTimeStr,
      anchorRealMs,
      setAt: new Date().toISOString(),
      setByNick: user?.game_nick || user?.nick || null,
    };
    setAnchor(next);
    saveAnomalyAnchor(next);
  }

  const slots = computeAnomalySlots(now);
  const slot0 = slots[0];
  const burning = now >= slot0.realStartMs && now < slot0.realEndMs;
  const isWarn = now >= slot0.warnStartMs && now < slot0.realStartMs;
  const msUntilNext = slot0.realStartMs - now;

  let statusPill;
  if (burning) {
    statusPill = { color: '#50c878', text: '⚡ Прорыв идёт прямо сейчас!' };
  } else if (isWarn) {
    statusPill = { color: '#e0a030', text: `⚠️ Прорыв через ${formatCountdown(msUntilNext)}!` };
  } else {
    statusPill = { color: '#e0c930', text: `До ближайшего прорыва: ${formatCountdown(msUntilNext)}` };
  }

  return (
    <div className="page">
      {/* Заголовок */}
      <div className="bears-hdr">
        <h2 className="page-title">🥶 Аномальные прорывы / Уледная жара</h2>
        <div className="stat-pills">
          <span className="pill" style={{
            color: statusPill.color,
            borderColor: statusPill.color,
            background: `${statusPill.color}18`,
          }}>
            {statusPill.text}
          </span>
          <button
            className={`rupor-btn ${soundOn ? 'rupor-on' : 'rupor-off'}`}
            onClick={toggleSound}
            title={soundOn ? 'Звук включён — нажми чтобы выключить' : 'Звук выключен — нажми чтобы включить'}
          >
            <SoundIcon on={soundOn} />
          </button>
        </div>
      </div>

      <InfoSpoiler {...ANOMALY_SPOILER} storageKey="spoiler_anomaly" />

      {/* Инфо-панель — якорь декоративный, на расписание не влияет */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '12px 16px',
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          {anchor ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#c8d6e5' }}>
                Якорь Z (игровое):{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#58a6ff', fontWeight: 700 }}>
                  {anchor.gameTimeStr}
                </span>
                {' · '}
                <span style={{ color: '#50c878' }}>GMT +00:00</span>
              </div>
              <div style={{ fontSize: 11, color: '#6e7681' }}>
                Уледная жара · 08:00–10:00 и 20:00–22:00
                {anchor.setByNick && (
                  <> · Установил: <span style={{ color: '#8b949e' }}>{anchor.setByNick}</span></>
                )}
                {' · Якорь X (реальное): '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#4a6a8a' }}>
                  {formatRealTime(anchor.anchorRealMs)}
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
          🥶 Установить время
        </button>
      </div>

      {/* 4 карточки ПРОРЫВ 1-4 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {slots.map((slot, i) => (
          <AnomalyCard
            key={i}
            cardIndex={i}
            warnStartMs={slot.warnStartMs}
            realStartMs={slot.realStartMs}
            realEndMs={slot.realEndMs}
          />
        ))}
      </div>

      {/* Подсказка */}
      <div className="tbl-hint">
        🥶 Оранжевая: 07:30–07:50 и 19:30–19:50 · Зелёная: 07:50–10:00 и 19:50–22:00 (GMT+00:00) ·
        Звук в 07:30 и 19:30 (если включён) · Страница не зависит от Горы Сияния
      </div>

      {showModal && (
        <SetAnomalyTimeModal
          onCommit={handleCommit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
