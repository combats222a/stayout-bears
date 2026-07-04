import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { api } from '../utils/api';
import { playTimerDoneSound } from '../utils/sound';

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

function getForecast(timer) {
  if (!timer.last_reset_at) return null;
  const resetMs = new Date(timer.last_reset_at).getTime();
  const expireMs = resetMs + timer.period_seconds * 1000;
  return new Date(expireMs);
}

// Инпут периода: клик/фокус выделяет значение целиком,
// чтобы ввод любой цифры сразу заменял стоящий там 0
function PeriodNumberInput({ value, onChange, max, className = 'input timer-period-num' }) {
  return (
    <input
      className={className}
      type="number"
      min="0"
      max={max}
      value={value}
      onFocus={e => e.target.select()}
      onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
    />
  );
}

// ── Модалка редактирования таймера (название + период) ─────────────────────
function EditTimerModal({ timer, onCommit, onClose }) {
  const [name, setName] = useState(timer.name);
  const [days, setDays] = useState(Math.floor(timer.period_seconds / 86400));
  const [hours, setHours] = useState(Math.floor((timer.period_seconds % 86400) / 3600));
  const [minutes, setMinutes] = useState(Math.floor((timer.period_seconds % 3600) / 60));
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!name.trim()) { setError('Введите название таймера'); return; }
    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60;
    if (totalSeconds < 60) { setError('Период должен быть не менее 1 минуты'); return; }
    onCommit({ name: name.trim(), period_seconds: totalSeconds });
    onClose();
  }

  function onKey(e) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-title">✎ Изменить таймер</div>
        <div className="modal-body">
          <label className="modal-label">Название таймера</label>
          <input
            className="input"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={onKey}
            autoFocus
          />
          <label className="modal-label" style={{ marginTop: 8 }}>Период таймера</label>
          <div className="timer-period-inputs">
            <PeriodNumberInput value={days} onChange={setDays} />
            <span className="timer-period-unit">д</span>
            <PeriodNumberInput value={hours} onChange={setHours} max={23} />
            <span className="timer-period-unit">ч</span>
            <PeriodNumberInput value={minutes} onChange={setMinutes} max={59} />
            <span className="timer-period-unit">м</span>
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

function TimerRow({
  timer, index, onReset, onEdit, onDelete, onToggleSound,
  dragState, onDragStart, onDragOver, onDrop, onDragEnd,
  registerRowRef, justDroppedId,
}) {
  const [, setTick] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const wasExpiredRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = getRemaining(timer);
  const forecast = getForecast(timer);
  const isExpired = remaining !== null && remaining <= 0;
  const isEmpty = remaining === null;

  // Проигрываем сигнал ровно один раз в момент истечения таймера, если звук включён
  useEffect(() => {
    if (isExpired && !wasExpiredRef.current) {
      if (timer.sound_enabled) playTimerDoneSound();
    }
    wasExpiredRef.current = isExpired;
  }, [isExpired, timer.sound_enabled]);

  const progressPct = remaining !== null
    ? Math.min(100, Math.max(0, (remaining / timer.period_seconds) * 100))
    : 0;

  const isDragging = dragState?.draggedIndex === index;
  const isDragOver = dragState?.overIndex === index && dragState?.draggedIndex !== index;

  return (
    <>
      {/* Desktop row */}
      <div
        ref={el => registerRowRef(timer.id, el)}
        className={`timer-row timer-row-desktop ${isDragging ? 'timer-row-dragging' : ''} ${isDragOver ? 'timer-row-dragover' : ''} ${justDroppedId === timer.id ? 'timer-row-dropped' : ''}`}
        onDragOver={e => onDragOver(e, index)}
        onDrop={e => onDrop(e, index)}
      >
        <div
          className="timer-row-drag"
          draggable
          onDragStart={e => onDragStart(e, index)}
          onDragEnd={onDragEnd}
          title="Перетащи чтобы изменить порядок"
        >≡</div>
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
        <div className="timer-row-forecast">
          {isEmpty ? '-- : -- : --' : isExpired ? 'Уже!' :
            forecast.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="timer-row-actions">
          <button className="btn btn-sm btn-primary btn-anim" onClick={() => onReset(timer.id)}>Обновить</button>
          <button className="btn btn-sm btn-orange btn-anim" onClick={() => setShowEdit(true)}>Изменить</button>
          <button className="btn btn-sm btn-danger btn-anim" onClick={() => onDelete(timer.id)}>Удалить</button>
          <button
            className={`rupor-btn rupor-btn-sm ${timer.sound_enabled ? 'rupor-on' : 'rupor-off'}`}
            onClick={() => onToggleSound(timer)}
            title={timer.sound_enabled ? 'Звук по окончании включён' : 'Звук по окончании выключен'}
          >
            {timer.sound_enabled ? '🔊' : '🔇'}
          </button>
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
          <span>🎯 В {isEmpty ? '--' : isExpired ? 'Уже!' : forecast.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="timer-card-actions">
          <button className="btn btn-sm btn-primary btn-anim" onClick={() => onReset(timer.id)}>Обновить</button>
          <button className="btn btn-sm btn-orange btn-anim" onClick={() => setShowEdit(true)}>Изменить</button>
          <button className="btn btn-sm btn-danger btn-anim" onClick={() => onDelete(timer.id)}>Удалить</button>
          <button
            className={`rupor-btn rupor-btn-sm ${timer.sound_enabled ? 'rupor-on' : 'rupor-off'}`}
            onClick={() => onToggleSound(timer)}
            title={timer.sound_enabled ? 'Звук по окончании включён' : 'Звук по окончании выключен'}
          >
            {timer.sound_enabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {showEdit && (
        <EditTimerModal
          timer={timer}
          onCommit={changes => onEdit(timer.id, changes)}
          onClose={() => setShowEdit(false)}
        />
      )}
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
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [creating, setCreating] = useState(false);

  // Drag & drop state
  const [dragState, setDragState] = useState({ draggedIndex: null, overIndex: null });
  const [justDroppedId, setJustDroppedId] = useState(null);
  const rowRefs = useRef({});
  const prevRectsRef = useRef({});
  const prevOrderRef = useRef(null);

  function registerRowRef(id, el) {
    if (el) rowRefs.current[id] = el;
    else delete rowRefs.current[id];
  }

  // FLIP-анимация: при изменении ПОРЯДКА таймеров (drag&drop) плавно "довозим"
  // каждую строку из её предыдущей позиции в новую (с лёгким пружинным доездом).
  //
  // Важно: раньше эффект запускался при ЛЮБОМ изменении массива timers (обновление
  // таймера, редактирование, автообновление раз в 30 сек и т.п.), а getBoundingClientRect()
  // возвращает координаты относительно окна просмотра — они меняются при скролле
  // колесом мыши или при сворачивании/разворачивании блоков на странице. Из-за этого
  // строки "прыгали" даже без реального изменения порядка. Теперь анимация и замер
  // позиций выполняются только тогда, когда порядок id действительно изменился.
  useLayoutEffect(() => {
    const order = timers.map(t => t.id).join(',');
    const orderChanged = prevOrderRef.current !== null && prevOrderRef.current !== order;
    prevOrderRef.current = order;

    if (!orderChanged) return;

    const newRects = {};
    for (const t of timers) {
      const el = rowRefs.current[t.id];
      if (!el) continue;
      newRects[t.id] = el.getBoundingClientRect();
    }

    for (const t of timers) {
      const el = rowRefs.current[t.id];
      if (!el) continue;
      const rect = newRects[t.id];
      const prev = prevRectsRef.current[t.id];
      if (prev) {
        const deltaY = prev.top - rect.top;
        if (Math.abs(deltaY) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translateY(${deltaY}px)`;
          // форсируем reflow, чтобы браузер применил стартовое положение
          // eslint-disable-next-line no-unused-expressions
          el.getBoundingClientRect();
          requestAnimationFrame(() => {
            el.style.transition = 'transform 320ms cubic-bezier(0.34, 1.2, 0.4, 1)';
            el.style.transform = '';
            el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
          });
        }
      }
    }
    prevRectsRef.current = newRects;
  }, [timers]);

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
      setHours(0);
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

  async function handleEdit(id, changes) {
    try {
      const data = await api.patch(`/timers/${id}`, changes);
      setTimers(prev => prev.map(t => t.id === id ? data.timer : t));
    } catch (e) { setError(e.message); }
  }

  async function handleToggleSound(timer) {
    try {
      const data = await api.patch(`/timers/${timer.id}`, { sound_enabled: !timer.sound_enabled });
      setTimers(prev => prev.map(t => t.id === timer.id ? data.timer : t));
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/timers/${id}`);
      setTimers(prev => prev.filter(t => t.id !== id));
    } catch (e) { setError(e.message); }
  }

  // ── Drag & drop reorder ──
  function handleDragStart(e, index) {
    setDragState({ draggedIndex: index, overIndex: index });
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e, index) {
    e.preventDefault();
    setDragState(prev => prev.draggedIndex === null ? prev : { ...prev, overIndex: index });
  }
  async function handleDrop(e, index) {
    e.preventDefault();
    const from = dragState.draggedIndex;
    if (from === null || from === index) { setDragState({ draggedIndex: null, overIndex: null }); return; }
    const next = [...timers];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setTimers(next);
    setDragState({ draggedIndex: null, overIndex: null });
    setJustDroppedId(moved.id);
    setTimeout(() => setJustDroppedId(id => (id === moved.id ? null : id)), 700);
    try {
      const data = await api.post('/timers/reorder', { order: next.map(t => t.id) });
      if (data?.timers) setTimers(data.timers);
    } catch (e) { setError(e.message); }
  }
  function handleDragEnd() {
    setDragState({ draggedIndex: null, overIndex: null });
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
              <div className="timer-row-forecast">Прогноз</div>
              <div className="timer-row-actions">Действия</div>
            </div>
          </div>
          <div className="timers-tbody">
            {timers.map((t, i) => (
              <TimerRow
                key={t.id}
                index={i}
                timer={t}
                onReset={handleReset}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleSound={handleToggleSound}
                dragState={dragState}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                registerRowRef={registerRowRef}
                justDroppedId={justDroppedId}
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
              <PeriodNumberInput value={days} onChange={setDays} />
              <span className="timer-period-unit">д</span>
              <PeriodNumberInput value={hours} onChange={setHours} max={23} />
              <span className="timer-period-unit">ч</span>
              <PeriodNumberInput value={minutes} onChange={setMinutes} max={59} />
              <span className="timer-period-unit">м</span>
            </div>
          </div>
          <button
            className="btn btn-primary timer-create-btn btn-anim"
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
