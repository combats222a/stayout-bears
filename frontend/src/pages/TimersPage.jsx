import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

function formatDuration(seconds) {
  if (seconds < 0) seconds = 0;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}д ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function getRemaining(timer) {
  if (!timer.last_reset_at) return null;
  const resetMs = new Date(timer.last_reset_at).getTime();
  const expireMs = resetMs + timer.period_seconds * 1000;
  const remaining = (expireMs - Date.now()) / 1000;
  return remaining;
}

function getElapsed(timer) {
  if (!timer.last_reset_at) return null;
  const resetMs = new Date(timer.last_reset_at).getTime();
  return (Date.now() - resetMs) / 1000;
}

function getForecast(timer) {
  if (!timer.last_reset_at) return null;
  const resetMs = new Date(timer.last_reset_at).getTime();
  const expireMs = resetMs + timer.period_seconds * 1000;
  return new Date(expireMs);
}

function TimerRow({ timer, onReset, onClear, onDelete }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = getRemaining(timer);
  const elapsed = getElapsed(timer);
  const forecast = getForecast(timer);
  const isExpired = remaining !== null && remaining <= 0;
  const isEmpty = remaining === null;

  const progressPct = remaining !== null
    ? Math.min(100, Math.max(0, (remaining / timer.period_seconds) * 100))
    : 0;

  return (
    <>
      {/* Desktop row */}
      <div className="timer-row timer-row-desktop">
        <div className="timer-row-drag">≡</div>
        <div className="timer-row-name">{timer.name}</div>
        <div className="timer-row-period">{formatDuration(timer.period_seconds)}</div>
        <div className={`timer-row-remaining ${isExpired ? 'expired' : isEmpty ? 'empty' : ''}`}>
          {isEmpty ? '-- : -- : --' : isExpired ? '⚡ Готово!' : formatDuration(remaining)}
          {!isEmpty && !isExpired && (
            <div className="timer-mini-bar">
              <div className="timer-mini-fill" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
        <div className="timer-row-elapsed">
          {isEmpty ? '-- : -- : --' : formatDuration(elapsed > 0 ? elapsed : 0)}
        </div>
        <div className="timer-row-forecast">
          {isEmpty ? '-- : -- : --' : isExpired ? 'Уже!' :
            forecast.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="timer-row-actions">
          <button className="btn btn-sm btn-primary" onClick={() => onReset(timer.id)}>Обновить</button>
          <button className="btn btn-sm btn-orange" onClick={() => onClear(timer.id)}>Очистить</button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(timer.id)}>Удалить</button>
        </div>
      </div>

      {/* Mobile card */}
      <div className="timer-card-mobile">
        <div className="timer-card-header">
          <span className="timer-card-name">{timer.name}</span>
          <span className="timer-card-period">каждые {formatDuration(timer.period_seconds)}</span>
        </div>
        <div className={`timer-card-remaining ${isExpired ? 'expired' : isEmpty ? 'empty' : ''}`}>
          {isEmpty ? '--:--:--' : isExpired ? '⚡ Готово!' : formatDuration(remaining)}
        </div>
        {!isEmpty && !isExpired && (
          <div className="timer-mini-bar" style={{ margin: '4px 0' }}>
            <div className="timer-mini-fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}
        <div className="timer-card-meta">
          <span>⏱ Прошло: {isEmpty ? '--' : formatDuration(elapsed > 0 ? elapsed : 0)}</span>
          <span>🎯 В {isEmpty ? '--' : isExpired ? 'Уже!' : forecast.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="timer-card-actions">
          <button className="btn btn-sm btn-primary" onClick={() => onReset(timer.id)}>Обновить</button>
          <button className="btn btn-sm btn-orange" onClick={() => onClear(timer.id)}>Очистить</button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(timer.id)}>Удалить</button>
        </div>
      </div>
    </>
  );
}

export default function TimersPage({ user }) {
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Форма создания
  const [name, setName] = useState('');
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/timers');
      setTimers(data.timers);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Авто-обновление каждые 30 сек
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  async function handleCreate() {
    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60;
    if (!name.trim()) return setError('Введите название таймера');
    if (totalSeconds < 60) return setError('Период должен быть не менее 1 минуты');
    setCreating(true);
    setError('');
    try {
      const data = await api.post('/timers', { name: name.trim(), period_seconds: totalSeconds });
      setTimers(prev => [...prev, data.timer]);
      setName('');
      setDays(0);
      setHours(1);
      setMinutes(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleReset(id) {
    try {
      const data = await api.post(`/timers/${id}/reset`);
      setTimers(prev => prev.map(t => t.id === id ? data.timer : t));
    } catch (e) { setError(e.message); }
  }

  async function handleClear(id) {
    try {
      const data = await api.post(`/timers/${id}/clear`);
      setTimers(prev => prev.map(t => t.id === id ? data.timer : t));
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/timers/${id}`);
      setTimers(prev => prev.filter(t => t.id !== id));
    } catch (e) { setError(e.message); }
  }

  if (loading) return <div className="page"><div className="text-muted">Загрузка...</div></div>;

  return (
    <div className="page">
      <div className="page-title">⏱️ Мои таймеры</div>
      <div className="timer-owner-note">
        🔒 Таймеры видит только их создатель — <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{user?.game_nick || user?.nick}</span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {timers.length === 0 ? (
        <div className="timers-empty">
          <div className="timers-empty-icon">🕐</div>
          <div>У вас пока нет таймеров</div>
          <div className="text-muted">Создайте первый таймер с помощью формы ниже</div>
        </div>
      ) : (
        <div className="timers-table">
          <div className="timers-thead timers-thead-desktop">
            <div className="timer-row timer-row-header">
              <div className="timer-row-drag"></div>
              <div className="timer-row-name">Название таймера</div>
              <div className="timer-row-period">Период</div>
              <div className="timer-row-remaining">Оставшееся время</div>
              <div className="timer-row-elapsed">Прошло времени</div>
              <div className="timer-row-forecast">Прогноз</div>
              <div className="timer-row-actions">Действия</div>
            </div>
          </div>
          <div className="timers-tbody">
            {timers.map(t => (
              <TimerRow
                key={t.id}
                timer={t}
                onReset={handleReset}
                onClear={handleClear}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Форма создания */}
      <div className="card timer-create-form">
        <div className="timer-create-title">Создать новый таймер</div>
        <div className="timer-create-row">
          <div className="timer-create-field">
            <label className="timer-field-label">Название таймера</label>
            <input
              className="input"
              placeholder="Введите название"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="timer-create-field timer-period-field">
            <label className="timer-field-label">Период таймера</label>
            <div className="timer-period-inputs">
              <input
                className="input timer-period-num"
                type="number"
                min="0"
                value={days}
                onChange={e => setDays(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="timer-period-unit">д</span>
              <input
                className="input timer-period-num"
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="timer-period-unit">ч</span>
              <input
                className="input timer-period-num"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={e => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="timer-period-unit">м</span>
            </div>
          </div>
          <button
            className="btn btn-primary timer-create-btn"
            onClick={handleCreate}
            disabled={creating}
            style={{ width: '100%' }}
          >
            + Создать таймер
          </button>
        </div>
      </div>

      {/* Timezone + update info */}
      <div className="timer-info-strip green-strip">
        🕐 Часовой пояс: <strong>Europe/Kiev</strong>
      </div>
    </div>
  );
}
