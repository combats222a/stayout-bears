import { useState, useEffect, useMemo } from 'react';
import InfoSpoiler from '../components/InfoSpoiler';
import { TIMECALC_SPOILER } from '../content/spoilerContent';
import MaskedTimeInput, { isDigitsComplete, digitsToTimeStr } from '../components/MaskedTimeInput';
import { computeTimeResult, formatDayShift, formatDeltaPhrase, pad2 } from '../utils/timeCalc';

// Быстрые дельты по возрастанию — «-35» и «+35» стоят по порядку между
// соседними значениями, а не просто дописаны в конец.
const QUICK_DELTAS = [-60, -35, -30, -15, -5, 5, 15, 30, 35, 60, 90, 120];

function onlyDigits(str, maxLen) {
  return (str || '').replace(/\D/g, '').slice(0, maxLen);
}

export default function TimeCalcPage() {
  const [baseDigits, setBaseDigits] = useState('');
  const [sign, setSign] = useState('+');
  const [deltaDigits, setDeltaDigits] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [copied, setCopied] = useState(false);

  // Тикаем раз в секунду — пока время не задано явно, база это "сейчас",
  // и результат живёт вместе с часами.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const baseEmpty = baseDigits.length === 0;
  const baseComplete = isDigitsComplete(baseDigits, 2);
  const basePartial = !baseEmpty && !baseComplete;

  const deltaMin = deltaDigits === '' ? 0 : parseInt(deltaDigits, 10);

  const result = useMemo(() => {
    if (basePartial) return null;
    let baseH, baseM;
    if (baseEmpty) {
      baseH = now.getHours();
      baseM = now.getMinutes();
    } else {
      const [h, m] = digitsToTimeStr(baseDigits, 2).split(':').map(Number);
      baseH = h; baseM = m;
    }
    return computeTimeResult({ baseH, baseM, sign, deltaMin, usedNow: baseEmpty });
  }, [baseDigits, baseEmpty, basePartial, sign, deltaMin, now]);

  function applyChip(d) {
    setSign(d < 0 ? '-' : '+');
    setDeltaDigits(String(Math.abs(d)));
  }

  function handleNow() {
    setBaseDigits(`${pad2(now.getHours())}${pad2(now.getMinutes())}`);
  }

  function handleReset() {
    setBaseDigits('');
    setSign('+');
    setDeltaDigits('');
  }

  async function handleCopy() {
    if (!result || result.error) return;
    try {
      await navigator.clipboard.writeText(result.resultLabel);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен (например, нет https) — просто молча не копируем
    }
  }

  const dayBadge = result && !result.error ? formatDayShift(result.dayShift) : null;
  const hasAnyInput = !baseEmpty || deltaDigits !== '';

  return (
    <div className="page timecalc-page">
      <div className="bears-hdr">
        <h2 className="page-title">🧮 Калькулятор времени</h2>
        {hasAnyInput && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={handleReset}>Сбросить</button>
        )}
      </div>

      <p className="timecalc-sub">
        Укажите время — цифрами, без двоеточия, оно проставится само — и на сколько минут его сдвинуть.
        Если время не трогать, расчёт идёт от текущего момента.
      </p>

      <InfoSpoiler {...TIMECALC_SPOILER} storageKey="spoiler_timecalc" />

      <div className="card timecalc-card">
        <div className="timecalc-row">
          <span className="timecalc-input-icon">⏱️</span>
          <MaskedTimeInput
            segments={2}
            value={baseDigits}
            onChange={digits => setBaseDigits(digits)}
            placeholder="сейчас"
            className="timecalc-input"
            autoFocus
          />
          <button type="button" className="btn btn-sm timecalc-now-btn" onClick={handleNow}>🕐 Сейчас</button>
        </div>

        <div className="timecalc-row timecalc-row-delta">
          <div className="timecalc-sign-toggle">
            <button
              type="button"
              className={sign === '-' ? 'active' : ''}
              onClick={() => setSign('-')}
              aria-label="Отнять"
            >−</button>
            <button
              type="button"
              className={sign === '+' ? 'active' : ''}
              onClick={() => setSign('+')}
              aria-label="Прибавить"
            >+</button>
          </div>
          <input
            className="timecalc-delta-input"
            value={deltaDigits}
            onChange={e => setDeltaDigits(onlyDigits(e.target.value, 4))}
            placeholder="35"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
          />
          <span className="timecalc-delta-suffix">мин</span>
        </div>

        <div className="timecalc-chips">
          {QUICK_DELTAS.map(d => (
            <button
              key={d}
              type="button"
              className={`timecalc-chip ${d < 0 ? 'timecalc-chip-minus' : 'timecalc-chip-plus'}`}
              onClick={() => applyChip(d)}
            >
              {d > 0 ? `+${d}` : d} мин
            </button>
          ))}
        </div>

        {basePartial && (
          <div className="timecalc-empty">Дозаполните время — не хватает цифр</div>
        )}

        {!basePartial && result?.error && (
          <div className="timecalc-error">🤔 Такого времени не бывает — проверьте часы и минуты</div>
        )}

        {!basePartial && result && !result.error && (
          <div className="timecalc-result">
            <div className="timecalc-result-main">
              <span className="timecalc-result-value">{result.resultLabel}</span>
              {dayBadge && <span className="timecalc-daybadge">{dayBadge}</span>}
              <button
                type="button"
                className={`timecalc-copy-btn ${copied ? 'timecalc-copy-btn-done' : ''}`}
                onClick={handleCopy}
              >
                {copied ? '✓ Скопировано' : '📋 Копировать'}
              </button>
            </div>
            <p className="timecalc-result-phrase">
              {result.usedNow ? `Сейчас (${result.baseLabel})` : result.baseLabel}
              {' '}{result.sign === '-' ? '−' : '+'} {formatDeltaPhrase(result.deltaMin)}{' = '}
              <b>{result.resultLabel}</b>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
