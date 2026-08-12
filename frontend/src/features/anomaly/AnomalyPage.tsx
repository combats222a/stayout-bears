import { useState, useEffect } from 'react';
import { computeAnomalySlots, getAnomalyLocation } from '../../utils/anomaly';
import { getLiveGameTime, formatRealTime, formatCountdown } from '../../utils/shining';
import { isAnomalySoundEnabled, setAnomalySoundEnabled } from '../../utils/soundPrefs';
import SoundIcon from '../../components/SoundIcon';
import InfoSpoiler from '../../components/InfoSpoiler';
import GuestLock from '../../components/GuestLock';
import MaskedTimeInput, { digitsToTimeStr } from '../../components/MaskedTimeInput';
import { ANOMALY_SPOILER } from '../../content/spoilerContent';
import { api } from '../../utils/api';
import type { AuthUser } from '../../types/entities';
import { useI18n, useLocaleDict } from '../../i18n';
import ruAnomaly from '../../i18n/locales/ru/anomaly';
import enAnomaly from '../../i18n/locales/en/anomaly';

interface CommitPayload {
  gameTimeStr: string;
  anchorRealMs: number;
}

// ─── Модалка ввода якоря Z — работает точно как на Сиянии ──────────
function SetAnomalyTimeModal({ onCommit, onClose }: { onCommit: (p: CommitPayload) => void; onClose: () => void }) {
  const c = useLocaleDict(ruAnomaly, enAnomaly);
  const [digits, setDigits] = useState('');
  const [error,  setError]  = useState('');

  function handleSubmit() {
    if (!digits) { setError(c.modalErrorEmpty); return; }
    const timeStr = digitsToTimeStr(digits, 2);
    const [gh, gm] = timeStr.split(':').map(Number);
    if (gh < 0 || gh > 23 || gm < 0 || gm > 59) { setError(c.modalErrorInvalid); return; }
    onCommit({ gameTimeStr: timeStr, anchorRealMs: Date.now() });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-title">{c.modalTitle}</div>
        <div className="modal-body" style={{ gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="modal-label">
              {c.modalLabel}
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
              {c.modalHint}
            </div>
          </div>

          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>{c.modalCancel}</button>
          <button className="modal-btn-ok btn-shiny" onClick={handleSubmit}>{c.modalSave}</button>
        </div>
      </div>
    </div>
  );
}

interface AnomalyCardProps {
  cardIndex: number;
  warnStartMs: number;
  realStartMs: number;
  realEndMs: number;
  anchorGameTimeStr: string;
  anchorRealMs: number;
}

// ─── Карточка одного прорыва ────────────────────────────────────────
function AnomalyCard({ cardIndex, warnStartMs, realStartMs, realEndMs, anchorGameTimeStr, anchorRealMs }: AnomalyCardProps) {
  const c = useLocaleDict(ruAnomaly, enAnomaly);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Живое игровое время — тикает одинаково на всех карточках, ровно как
  // на Сиянии (getLiveGameTime универсальна и не завязана на конкретный
  // раздел).
  const liveGameTime = getLiveGameTime(anchorGameTimeStr, anchorRealMs, 0, now);

  const burning = now >= realStartMs && now < realEndMs;
  const msUntilStart = realStartMs - now;
  const msUntilEnd   = realEndMs - now;
  const isWarn = now >= warnStartMs && now < realStartMs;

  // ── Цвета ──
  // Ближайшее окно (cardIndex === 0), пока оно ещё не в предупреждении и
  // не активно, подсвечивается синим — точно как на Горе Сияния.
  let accentColor: string, borderColor: string, bgColor: string, dotColor: string;
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

  const CARD_LABELS = c.cardLabels;

  // ── Таймер ──
  let timerLabel: string, timerValue: string, timerColor: string;
  if (burning) {
    timerLabel = c.untilEnd;
    timerValue = msUntilEnd > 0 ? formatCountdown(msUntilEnd) : '00:00';
    timerColor = '#50c878';
  } else {
    timerLabel = c.inLabel;
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

      {/* Игровое время — тикает, одинаково для всех карточек */}
      <div>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {c.gameTimeLabel}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700,
          color: accentColor, letterSpacing: '0.04em', lineHeight: 1,
        }}>
          {liveGameTime}
        </div>
      </div>

      {/* Реальное время начала ЭТОГО прорыва */}
      <div>
        <div style={{ fontSize: 9, color: '#6e7681', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {burning ? c.startedAt : c.startsAt}
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

export interface AnomalyStateData {
  gameTimeStr?: string;
  anchorRealMs?: number;
  anchorIso?: string;
  setAt?: string;
}

interface AnomalyPageProps {
  user: AuthUser | null;
  anomalyData: AnomalyStateData | null;
  onAnomalyChange: (data: AnomalyStateData) => void;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

// ─── Основная страница ───────────────────────────────────────────
// Работает как «Гора Сияния»: якорь Z/X реально запускает расчёт циклов
// по игровой скорости времени. Отличия: локация всегда зафиксирована на
// GMT+00:00 (выбор недоступен), окна другие — два цикла в сутки
// (07:30–10:00 и 19:30–22:00 по игре) вместо четырёх равных по 6 игр.
// часов, и якорь хранится на бэкенде ПРИВЯЗАННЫМ К АККАУНТУ (не к
// клану и не в браузере) — видит и настраивает только сам игрок, с
// любого устройства после входа.
export default function AnomalyPage({ user, anomalyData, onAnomalyChange, isGuest, onLoginClick = () => {} }: AnomalyPageProps) {
  const { locale } = useI18n();
  const c = useLocaleDict(ruAnomaly, enAnomaly);
  const [showModal, setShowModal] = useState(false);
  const [now, setNow]             = useState(() => Date.now());
  const [soundOn, setSoundOn]     = useState(() => isAnomalySoundEnabled());
  const [error, setError]         = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setAnomalySoundEnabled(next);
  }

  async function handleCommit({ gameTimeStr, anchorRealMs }: CommitPayload) {
    const data: AnomalyStateData = {
      gameTimeStr,
      anchorRealMs,
      anchorIso: new Date(anchorRealMs).toISOString(),
      setAt: new Date().toISOString(),
    };
    onAnomalyChange(data);
    try { await api.post('/anomaly/set', data); } catch (e) { setError((e as Error).message); }
  }

  if (!user) {
    return (
      <div className="page">
        <h2 className="page-title">{c.pageTitle}</h2>
        <InfoSpoiler {...ANOMALY_SPOILER[locale]} storageKey="spoiler_anomaly" />
        {isGuest ? (
          <GuestLock
            icon="🥶"
            title={c.guestLockTitle}
            text={c.guestLockText}
            onLoginClick={onLoginClick}
          />
        ) : (
          <div className="empty-state"><p>{c.loginToTrack}</p></div>
        )}
      </div>
    );
  }

  const loc = getAnomalyLocation();
  const hasData = Boolean(anomalyData?.gameTimeStr && anomalyData?.anchorRealMs);

  const slots = hasData
    ? computeAnomalySlots(anomalyData!.gameTimeStr, anomalyData!.anchorRealMs!, now)
    : null;

  // Статус-строка
  let statusPill: { color: string; text: string } | null = null;
  if (slots && slots[0]) {
    const slot0 = slots[0];
    const burning = now >= slot0.realStartMs && now < slot0.realEndMs;
    const isWarn = now >= slot0.warnStartMs && now < slot0.realStartMs;
    if (burning) {
      statusPill = { color: '#50c878', text: c.burningNow };
    } else {
      const msUntilNext = slot0.realStartMs - now;
      if (isWarn) {
        statusPill = { color: '#e0a030', text: c.breachIn(formatCountdown(msUntilNext)) };
      } else {
        statusPill = { color: '#4a9edd', text: c.untilNext(formatCountdown(msUntilNext)) };
      }
    }
  }

  return (
    <div className="page">
      {/* Заголовок */}
      <div className="bears-hdr">
        <h2 className="page-title">{c.pageTitle}</h2>
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
            title={soundOn ? c.soundOnTitle : c.soundOffTitle}
          >
            <SoundIcon on={soundOn} />
          </button>
        </div>
      </div>

      <div className="timer-owner-note">
        {c.ownerNotePrefix} <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{user?.game_nick || user?.nick}</span>
      </div>

      <InfoSpoiler {...ANOMALY_SPOILER[locale]} storageKey="spoiler_anomaly" />

      {error && <div className="error-banner">{error}</div>}

      {/* Инфо-панель — якорь работает как на Сиянии, локация зафиксирована */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '12px 16px',
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          {hasData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#c8d6e5' }}>
                {c.anchorGameLabel}{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#58a6ff', fontWeight: 700 }}>
                  {anomalyData!.gameTimeStr}
                </span>
                {' · '}
                <span style={{ color: '#50c878' }}>{loc.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#6e7681' }}>
                {loc.name}
                {' · '}{c.anchorRealLabel}{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#4a6a8a' }}>
                  {formatRealTime(anomalyData!.anchorRealMs!)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#8b949e' }}>
              {c.enterTimePrompt}
            </div>
          )}
        </div>
        <button className="modal-btn-ok btn-shiny"
          style={{ padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setShowModal(true)}
        >
          {c.setTimeBtn}
        </button>
      </div>

      {/* 4 карточки ПРОРЫВ 1-4 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {hasData && slots
          ? slots.map((slot, i) => (
              <AnomalyCard
                key={i}
                cardIndex={i}
                warnStartMs={slot.warnStartMs}
                realStartMs={slot.realStartMs}
                realEndMs={slot.realEndMs}
                anchorGameTimeStr={anomalyData!.gameTimeStr!}
                anchorRealMs={anomalyData!.anchorRealMs!}
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
                  {c.cardLabels[i]}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: '#1e2a3a' }}>--:--</div>
              </div>
            ))
        }
      </div>

      {/* Подсказка */}
      <div className="tbl-hint">
        🥶 Оранжевая: 07:30–07:50 и 19:30–19:50 (игровое) · Зелёная: 07:50–10:00 и 19:50–22:00 (игровое) ·
        Локация зафиксирована на GMT+00:00 · Звук в момент появления оранжевой рамки ·
        Страница не зависит от Горы Сияния
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
