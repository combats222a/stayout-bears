import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { parseTimeExpr, formatDayShift, formatDeltaPhrase, pad2 } from '../utils/timeCalc';

// Набор быстрых кнопок-дельт — самые ходовые интервалы вместо ручного
// набора цифр каждый раз.
const QUICK_DELTAS = [-60, -30, -15, -5, 5, 15, 30, 60, 90, 120];

export default function TimeCalcPage() {
  const [expr, setExpr] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Тикаем раз в секунду — если база не указана явно ("+35"), результат
  // считается от текущего момента и живёт вместе с часами.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsed = useMemo(() => parseTimeExpr(expr, now), [expr, now]);

  const commitHistory = useCallback((exprStr, parsedObj) => {
    setHistory(prev => {
      if (prev[0]?.expr === exprStr) return prev;
      const item = { expr: exprStr, result: parsedObj.resultLabel, dayShift: parsedObj.dayShift, ts: Date.now() };
      const filtered = prev.filter(p => p.expr !== exprStr);
      return [item, ...filtered].slice(0, 6);
    });
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && parsed && !parsed.error && expr.trim()) {
      commitHistory(expr.trim(), parsed);
    }
  }

  function handleBlur() {
    if (parsed && !parsed.error && expr.trim()) {
      commitHistory(expr.trim(), parsed);
    }
  }

  function applyChip(deltaMin) {
    const base = (parsed && !parsed.error) ? parsed.baseLabel : `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const sign = deltaMin < 0 ? '-' : '+';
    const newExpr = `${base} ${sign}${Math.abs(deltaMin)}`;
    setExpr(newExpr);
    const newParsed = parseTimeExpr(newExpr, now);
    if (newParsed && !newParsed.error) commitHistory(newExpr, newParsed);
    inputRef.current?.focus();
  }

  function handleNow() {
    setExpr(`${pad2(now.getHours())}:${pad2(now.getMinutes())} `);
    inputRef.current?.focus();
  }

  function handleClear() {
    setExpr('');
    inputRef.current?.focus();
  }

  async function handleCopy() {
    if (!parsed || parsed.error) return;
    try {
      await navigator.clipboard.writeText(parsed.resultLabel);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен (например, нет https) — просто молча не копируем
    }
  }

  function restoreFromHistory(item) {
    setExpr(item.expr);
    inputRef.current?.focus();
  }

  const trimmed = expr.trim();
  const dayBadge = parsed && !parsed.error ? formatDayShift(parsed.dayShift) : null;

  return (
    <div className="page timecalc-page">
      <div className="bears-hdr">
        <h2 className="page-title">🧮 Калькулятор времени</h2>
      </div>

      <p className="timecalc-sub">
        Пишите время и дельту одной строкой — например <code className="timecalc-code">02:01 +35</code> —
        результат считается сразу, без кнопки «=». Дельту можно указывать минутами или через двоеточие
        (<code className="timecalc-code">+1:20</code>), а если время не указать — расчёт пойдёт от текущего момента.
      </p>

      <div className="card timecalc-card">
        <div className="timecalc-input-row">
          <span className="timecalc-input-icon">⏱️</span>
          <input
            ref={inputRef}
            className="timecalc-input"
            value={expr}
            onChange={e => setExpr(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="02:01 +35"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          {trimmed && (
            <button type="button" className="timecalc-clear-btn" onClick={handleClear} aria-label="Очистить">✕</button>
          )}
          <button type="button" className="btn btn-sm timecalc-now-btn" onClick={handleNow}>🕐 Сейчас</button>
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

        {!trimmed && (
          <div className="timecalc-empty">
            Начните вводить время — результат появится здесь сразу
          </div>
        )}

        {trimmed && parsed?.error && (
          <div className="timecalc-error">
            🤔 Не получилось разобрать выражение. Форматы: <b>02:01 +35</b>, <b>14:20-90</b>, <b>+45</b>, <b>-1:30</b>
          </div>
        )}

        {trimmed && parsed && !parsed.error && (
          <div className="timecalc-result">
            <div className="timecalc-result-main">
              <span className="timecalc-result-value">{parsed.resultLabel}</span>
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
              {parsed.usedNow ? `Сейчас (${parsed.baseLabel})` : parsed.baseLabel}
              {' '}{parsed.sign === '-' ? '−' : '+'} {formatDeltaPhrase(parsed.deltaMin)}{' = '}
              <b>{parsed.resultLabel}</b>
            </p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card timecalc-history-card">
          <div className="timecalc-history-title">Недавние расчёты</div>
          <div className="timecalc-history-list">
            {history.map((h, i) => (
              <button
                key={`${h.ts}-${i}`}
                type="button"
                className="timecalc-history-item"
                onClick={() => restoreFromHistory(h)}
              >
                <span className="timecalc-history-expr">{h.expr}</span>
                <span className="timecalc-history-arrow">→</span>
                <span className="timecalc-history-result">
                  {h.result}{h.dayShift ? ` (${formatDayShift(h.dayShift)})` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
