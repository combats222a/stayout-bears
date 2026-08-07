import {
  useState, useEffect, useCallback, useRef,
  ChangeEvent, DragEvent, FocusEvent, KeyboardEvent,
} from 'react';
import { api } from '../../utils/api';
import InfoSpoiler from '../../components/InfoSpoiler';
import GuestLock from '../../components/GuestLock';
import SoundIcon from '../../components/SoundIcon';
import { TIMERS_SPOILER } from '../../content/spoilerContent';
import type { AuthUser, UserTimer } from '../../types/entities';

function pad(n: number): string { return String(Math.floor(n)).padStart(2, '0'); }

// "Осталось" — чистый счётчик H:MM:SS (часы не обрезаются по 24, как у
// медведей: там период всегда меньше суток, а у пользовательских таймеров
// может быть многодневный период — поэтому просто общее число часов).
function formatCountdown(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// "Интервал" — человекочитаемый период без секунд: "23 ч", "12 ч", "3 д",
// "5 д 12 ч". Единицы меньше часа показываем в минутах, только если период
// короче часа целиком (иначе колонка не даёт лишней точности).
function formatInterval(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const rest = seconds % 86400;
  const h = Math.floor(rest / 3600);
  const m = Math.floor((rest % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} д`);
  if (h > 0) parts.push(`${h} ч`);
  if (d === 0 && h === 0) parts.push(`${m} мин`);
  return parts.join(' ');
}

function getRemaining(timer: UserTimer): number | null {
  if (!timer.last_reset_at) return null;
  const resetMs = new Date(timer.last_reset_at).getTime();
  const expireMs = resetMs + timer.period_seconds * 1000;
  const remaining = (expireMs - Date.now()) / 1000;
  return remaining;
}

function getForecast(timer: UserTimer): Date | null {
  if (!timer.last_reset_at) return null;
  const resetMs = new Date(timer.last_reset_at).getTime();
  const expireMs = resetMs + timer.period_seconds * 1000;
  return new Date(expireMs);
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.6-4.6M4 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14.6 4.6M20 20v-5h-5" />
    </svg>
  );
}

function DotsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function InfoIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

// Небольшая подсказка: значок ⓘ с нативным title-тултипом на ховере —
// без отдельного тяжёлого абзаца текста под полем.
function InfoTip({ text }: { text: string }) {
  return (
    <span className="info-tip" title={text} tabIndex={0}>
      <InfoIcon />
    </span>
  );
}

function EditPencilIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// Числовое поле со стрелками вверх/вниз (вместо нативного OS-спиннера) —
// как в макете обновлённой модалки редактирования таймера.
function SteppedNumberInput({ value, onChange, max = 999 }: { value: number; onChange: (v: number) => void; max?: number }) {
  function clamp(v: number) { return Math.min(max, Math.max(0, v)); }
  return (
    <div className="stepped-input">
      <input
        className="input stepped-input-field"
        type="number"
        min="0"
        max={max}
        value={value}
        onFocus={e => e.target.select()}
        onChange={e => onChange(clamp(parseInt(e.target.value) || 0))}
      />
      <div className="stepped-input-arrows">
        <button type="button" className="stepped-input-arrow" tabIndex={-1} aria-label="Увеличить"
          onClick={() => onChange(clamp(value + 1))}>
          <svg width="9" height="6" viewBox="0 0 9 6" fill="currentColor" aria-hidden="true"><path d="M4.5 0L9 6H0z" /></svg>
        </button>
        <button type="button" className="stepped-input-arrow" tabIndex={-1} aria-label="Уменьшить"
          onClick={() => onChange(clamp(value - 1))}>
          <svg width="9" height="6" viewBox="0 0 9 6" fill="currentColor" aria-hidden="true"><path d="M4.5 6L0 0h9z" /></svg>
        </button>
      </div>
    </div>
  );
}

interface MenuPos {
  top: number | null;
  bottom: number | null;
  right: number;
}

// "···" меню действий строки (Изменить / Удалить) — закрывается по клику снаружи или Esc
//
// Меню позиционируется через position:fixed по координатам самой кнопки —
// оно всегда поверх всего и не зависит от overflow родительской таблицы.
function RowActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = btnRef.current!.getBoundingClientRect();
    const openUpward = window.innerHeight - rect.bottom < 110;
    setPos({
      top: openUpward ? null : rect.bottom + 6,
      bottom: openUpward ? (window.innerHeight - rect.top + 6) : null,
      right: window.innerWidth - rect.right,
    });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    function onScrollOrResize() { setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  return (
    <div className="row-menu">
      <button
        ref={btnRef}
        className="icon-btn"
        onClick={() => (open ? setOpen(false) : openMenu())}
        title="Ещё"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <DotsIcon />
      </button>
      {open && pos && (
        <div
          className="row-menu-dropdown"
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top ?? undefined, bottom: pos.bottom ?? undefined, right: pos.right }}
        >
          <button className="row-menu-item" onClick={() => { setOpen(false); onEdit(); }}>Изменить</button>
          <button className="row-menu-item row-menu-item-danger" onClick={() => { setOpen(false); onDelete(); }}>Удалить</button>
        </div>
      )}
    </div>
  );
}

// Инпут периода в форме создания: клик/фокус выделяет значение целиком,
// чтобы ввод любой цифры сразу заменял стоящий там 0
function PeriodNumberInput({ value, onChange, max, className = 'input timer-period-num' }: {
  value: number; onChange: (v: number) => void; max?: number; className?: string;
}) {
  return (
    <input
      className={className}
      type="number"
      min="0"
      max={max}
      value={value}
      onFocus={(e: FocusEvent<HTMLInputElement>) => e.target.select()}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
    />
  );
}

interface TimerEditChanges {
  name?: string;
  remaining_seconds?: number;
  period_seconds?: number;
  sound_enabled?: boolean;
}

// ── Модалка редактирования таймера (название + интервал + оставшееся время) ──
// Интервал теперь редактируется только здесь (в таблице колонка "Интервал"
// стала чистым read-only отображением, как "Квадрат" у медведей — без
// инлайн-полей внутри строки, чтобы не плодить визуальный шум).
function EditTimerModal({ timer, onCommit, onClose }: {
  timer: UserTimer; onCommit: (changes: TimerEditChanges) => void; onClose: () => void;
}) {
  const [name, setName] = useState(timer.name);

  const [days, setDays] = useState(Math.floor(timer.period_seconds / 86400));
  const [hours, setHours] = useState(Math.floor((timer.period_seconds % 86400) / 3600));
  const [minutes, setMinutes] = useState(Math.floor((timer.period_seconds % 3600) / 60));

  // Оставшееся время — отдельное поле, не связанное с полем интервала.
  // Предзаполняем тем, сколько реально осталось прямо сейчас (а не полным
  // периодом), чтобы можно было точечно поправить его, например если
  // забыли вовремя нажать "Обновить" и таймер утёк на лишний час.
  const initialRemaining = (() => {
    const r = getRemaining(timer);
    if (r === null) return timer.period_seconds;
    return Math.max(0, Math.round(r));
  })();
  const [remDays, setRemDays] = useState(Math.floor(initialRemaining / 86400));
  const [remHours, setRemHours] = useState(Math.floor((initialRemaining % 86400) / 3600));
  const [remMinutes, setRemMinutes] = useState(Math.floor((initialRemaining % 3600) / 60));

  const [error, setError] = useState('');

  // Пока пользователь трогает только «Название»/«Интервал», «Осталось до
  // события» не отправляем вовсе — иначе в бэк уходил бы remainingSeconds,
  // снятый ещё в момент ОТКРЫТИЯ модалки, и при сохранении таймер откатился
  // бы назад на секунды/минуты, утёкшие пока модалка была открыта.
  const [remainingTouched, setRemainingTouched] = useState(false);

  function updateRemaining(nextRemDays: number, nextRemHours: number, nextRemMinutes: number) {
    setRemDays(nextRemDays);
    setRemHours(nextRemHours);
    setRemMinutes(nextRemMinutes);
    setRemainingTouched(true);
  }

  function handleSubmit() {
    if (!name.trim()) { setError('Введите название таймера'); return; }

    const newPeriodSeconds = days * 86400 + hours * 3600 + minutes * 60;
    const periodChanged = newPeriodSeconds !== timer.period_seconds;
    if (periodChanged && newPeriodSeconds < 60) { setError('Интервал должен быть не менее 1 минуты'); return; }

    const changes: TimerEditChanges = { name: name.trim() };
    if (periodChanged) changes.period_seconds = newPeriodSeconds;

    if (remainingTouched) {
      changes.remaining_seconds = remDays * 86400 + remHours * 3600 + remMinutes * 60;
    } else if (periodChanged) {
      // Интервал уменьшили, а остаток руками не трогали — подрезаем остаток
      // под новый интервал, чтобы прогресс-бар не зашкаливал.
      const currentRemaining = getRemaining(timer);
      const clampedRemaining = currentRemaining === null
        ? newPeriodSeconds
        : Math.min(Math.max(0, Math.round(currentRemaining)), newPeriodSeconds);
      changes.remaining_seconds = clampedRemaining;
    }

    onCommit(changes);
    onClose();
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box edit-timer-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <div className="modal-title-main">
            <span className="modal-title-icon-box"><EditPencilIcon /></span>
            <span className="modal-title-text">Редактировать таймер</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="modal-body">
          <label className="modal-label">Название таймера</label>
          <input
            className="input"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={onKey}
            autoFocus
          />

          <div className="modal-divider" />

          <label className="modal-label">Интервал</label>
          <div className="timer-period-inputs">
            <SteppedNumberInput value={days} onChange={setDays} />
            <span className="timer-period-unit">дн.</span>
            <SteppedNumberInput value={hours} onChange={setHours} max={23} />
            <span className="timer-period-unit">ч.</span>
            <SteppedNumberInput value={minutes} onChange={setMinutes} max={59} />
            <span className="timer-period-unit">мин.</span>
          </div>

          <div className="modal-divider" />

          <label className="modal-label">
            Осталось до события
            <InfoTip text="Поправьте, если забыли вовремя нажать «Обновить» — интервал при этом не изменится" />
          </label>
          <div className="timer-period-inputs">
            <SteppedNumberInput value={remDays} onChange={d => updateRemaining(d, remHours, remMinutes)} />
            <span className="timer-period-unit">дн.</span>
            <SteppedNumberInput value={remHours} onChange={h => updateRemaining(remDays, h, remMinutes)} max={23} />
            <span className="timer-period-unit">ч.</span>
            <SteppedNumberInput value={remMinutes} onChange={m => updateRemaining(remDays, remHours, m)} max={59} />
            <span className="timer-period-unit">мин.</span>
          </div>
          <div className="modal-hint">Введите время, которое показывает игра.</div>

          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="modal-btn-ok btn-shiny" onClick={handleSubmit}>Сохранить изменения</button>
        </div>
      </div>
    </div>
  );
}

interface DragState {
  draggedIndex: number | null;
  overIndex: number | null;
}

interface TimerRowProps {
  timer: UserTimer;
  index: number;
  onReset: (id: number) => void;
  onEdit: (id: number, changes: TimerEditChanges) => void;
  onDelete: (id: number) => void;
  onToggleSound: (timer: UserTimer) => void;
  dragState: DragState;
  onDragStart: (e: DragEvent<HTMLSpanElement>, index: number) => void;
  onDragOver: (e: DragEvent<HTMLTableRowElement>, index: number) => void;
  onDrop: (e: DragEvent<HTMLTableRowElement>, index: number) => void;
  onDragEnd: () => void;
  justDroppedId: number | null;
}

// Порог "скоро закончится" — последние 10% периода. Пороговая доля, а не
// фиксированное время, чтобы одинаково хорошо работать и на 20-минутном,
// и на 5-дневном таймере.
const WARNING_FRACTION = 0.1;

// Единая строка таблицы для десктопа и мобилки — как и в таблице медведей,
// адаптацию под маленький экран делает чистый CSS (см. .timers-tbl в
// styles.css), а не отдельное JS-поддерево.
function TimerRow({
  timer, index, onReset, onEdit, onDelete, onToggleSound,
  dragState, onDragStart, onDragOver, onDrop, onDragEnd, justDroppedId,
}: TimerRowProps) {
  const [, setTick] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = getRemaining(timer);
  const forecast = getForecast(timer);
  const isEmpty = remaining === null;
  const isExpired = !isEmpty && remaining! <= 0;
  const isWarning = !isEmpty && !isExpired && remaining! <= timer.period_seconds * WARNING_FRACTION;

  // Звук по истечении проигрывает только глобальный вотчер
  // (useGlobalSoundWatcher, живёт на уровне App) — независимо от открытой
  // вкладки, поэтому здесь звук не запускаем.

  const elapsedPct = isEmpty ? 0 : Math.min(100, Math.max(0, 100 - (remaining! / timer.period_seconds) * 100));

  let rowCls = 'bear-row';
  if (isExpired)      rowCls += ' row-ready';
  else if (isWarning) rowCls += ' row-warn';
  else if (!isEmpty)  rowCls += ' row-active';

  let barColor = '#4a9edd';
  if (isWarning) barColor = '#e0a030';

  let valColor = '#c8d6e5';
  if (isWarning) valColor = '#e0a030';
  else if (isEmpty) valColor = '#3a5a7a';

  const isDragging = dragState?.draggedIndex === index;
  const isDragOver = dragState?.overIndex === index && dragState?.draggedIndex !== index;

  let rowClasses = rowCls;
  if (isDragging) rowClasses += ' timer-row-dragging';
  if (isDragOver) rowClasses += ' timer-row-dragover';
  if (justDroppedId === timer.id) rowClasses += ' timer-row-dropped';

  return (
    <>
      <tr
        className={rowClasses}
        onDragOver={e => onDragOver(e, index)}
        onDrop={e => onDrop(e, index)}
      >
        <td className="td-name" data-label="Название">
          <span className="td-name-inner">
            <span
              className="row-drag-handle"
              draggable
              onDragStart={e => onDragStart(e, index)}
              onDragEnd={onDragEnd}
              title="Перетащи чтобы изменить порядок"
            >⋮⋮</span>
            <span className="timer-row-name-text">{timer.name}</span>
          </span>
        </td>
        <td className="td-interval" data-label="Интервал">{formatInterval(timer.period_seconds)}</td>
        <td className="td-remaining" data-label="Осталось">
          {isExpired
            ? <span className="spawn-tag">Готово</span>
            : <div className="prog-wrap">
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${elapsedPct}%`, background: barColor }} />
                </div>
                <span className="timer-val" style={{ color: valColor }}>
                  {isEmpty ? '--:--:--' : formatCountdown(remaining!)}
                </span>
              </div>
          }
        </td>
        <td className={`td-clock${isEmpty ? ' td-clock-empty' : ''}`} data-label="Доступен в">
          {isEmpty
            ? '--:--'
            : isExpired
              ? <span style={{ color: '#50c878' }}>Сейчас</span>
              : forecast!.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="td-actions-cell" data-label="Действия">
          <div className="td-actions-timer">
            <button className="icon-btn icon-btn-primary" onClick={() => onReset(timer.id)} title="Обновить">
              <RefreshIcon />
            </button>
            <button
              className={`rupor-btn rupor-btn-sm ${timer.sound_enabled ? 'rupor-on' : 'rupor-off'}`}
              onClick={() => onToggleSound(timer)}
              title={timer.sound_enabled ? 'Звук по окончании включён' : 'Звук по окончании выключен'}
            >
              <SoundIcon on={timer.sound_enabled} />
            </button>
            <RowActionsMenu onEdit={() => setShowEdit(true)} onDelete={() => onDelete(timer.id)} />
          </div>
        </td>
      </tr>

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

interface TimersPageProps {
  user: AuthUser | null;
  onLoginClick?: () => void;
}

export default function TimersPage({ user, onLoginClick = () => {} }: TimersPageProps) {
  const [timers, setTimers] = useState<UserTimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Форма создания
  const [name, setName] = useState('');
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [creating, setCreating] = useState(false);

  // Drag & drop state
  const [dragState, setDragState] = useState<DragState>({ draggedIndex: null, overIndex: null });
  const [justDroppedId, setJustDroppedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await api.get('/timers');
      setTimers(data.timers);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleReset(id: number) {
    try {
      const data = await api.post(`/timers/${id}/reset`);
      setTimers(prev => prev.map(t => t.id === id ? data.timer : t));
    } catch (e) { setError((e as Error).message); }
  }

  async function handleEdit(id: number, changes: TimerEditChanges) {
    try {
      const data = await api.patch(`/timers/${id}`, changes);
      setTimers(prev => prev.map(t => t.id === id ? data.timer : t));
    } catch (e) { setError((e as Error).message); }
  }

  async function handleToggleSound(timer: UserTimer) {
    try {
      const data = await api.patch(`/timers/${timer.id}`, { sound_enabled: !timer.sound_enabled });
      setTimers(prev => prev.map(t => t.id === timer.id ? data.timer : t));
    } catch (e) { setError((e as Error).message); }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/timers/${id}`);
      setTimers(prev => prev.filter(t => t.id !== id));
    } catch (e) { setError((e as Error).message); }
  }

  // ── Drag & drop reorder — старт только с маленькой ручки (.row-drag-handle)
  // внутри ячейки "Название", а не с любой точки строки, чтобы клики по
  // кнопкам действий/меню не превращались в случайный drag.
  function handleDragStart(e: DragEvent<HTMLSpanElement>, index: number) {
    setDragState({ draggedIndex: index, overIndex: index });
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e: DragEvent<HTMLTableRowElement>, index: number) {
    e.preventDefault();
    setDragState(prev => prev.draggedIndex === null ? prev : { ...prev, overIndex: index });
  }
  async function handleDrop(e: DragEvent<HTMLTableRowElement>, index: number) {
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
    } catch (e) { setError((e as Error).message); }
  }
  function handleDragEnd() {
    setDragState({ draggedIndex: null, overIndex: null });
  }

  if (loading) return <div className="page"><div className="text-muted">Загрузка...</div></div>;

  if (!user) {
    return (
      <div className="page">
        <div className="page-title">⏱️ Мои таймеры</div>
        <InfoSpoiler {...TIMERS_SPOILER} storageKey="spoiler_timers" />
        <GuestLock
          icon="⏱"
          title="Личные таймеры — только твои"
          text="Таймеры видит и настраивает только их создатель. Зарегистрируйся, чтобы завести свои — под откаты заданий, ресурсов или чего угодно ещё."
          onLoginClick={onLoginClick}
        />
      </div>
    );
  }

  return (
    <div className="page bears-page">
      <div className="bears-hdr">
        <div>
          <div className="page-title">⏱️ Таймеры</div>
          <div className="page-subtitle">Создавайте таймеры, отслеживайте время и получайте уведомления</div>
        </div>
      </div>
      <div className="timer-owner-note">
        🔒 Таймеры видит только их создатель — <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{user?.game_nick || user?.nick}</span>
      </div>

      <InfoSpoiler {...TIMERS_SPOILER} storageKey="spoiler_timers" />

      {error && <div className="error-banner">{error}</div>}

      {timers.length === 0 ? (
        <div className="timers-empty">
          <div className="timers-empty-icon">🕐</div>
          <div>У вас пока нет таймеров</div>
          <div className="text-muted">Создайте первый таймер с помощью формы ниже</div>
        </div>
      ) : (
        <div className="timers-tbl-wrap">
          <table className="timers-tbl">
            <thead>
              <tr>
                <th>Название</th>
                <th>Интервал</th>
                <th>Осталось</th>
                <th>Доступен в</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
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
                  justDroppedId={justDroppedId}
                />
              ))}
            </tbody>
          </table>
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
            className="btn btn-primary btn-shiny timer-create-btn btn-anim"
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
