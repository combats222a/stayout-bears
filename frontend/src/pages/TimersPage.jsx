import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { api } from '../utils/api';
import InfoSpoiler from '../components/InfoSpoiler';
import GuestLock from '../components/GuestLock';
import SoundIcon from '../components/SoundIcon';
import { TIMERS_SPOILER } from '../content/spoilerContent';

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

function RefreshIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.6-4.6M4 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14.6 4.6M20 20v-5h-5" />
    </svg>
  );
}

function DotsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function InfoIcon({ size = 13 }) {
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
function InfoTip({ text }) {
  return (
    <span className="info-tip" title={text} tabIndex={0}>
      <InfoIcon />
    </span>
  );
}

function EditPencilIcon({ size = 18 }) {
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
function SteppedNumberInput({ value, onChange, max = 999 }) {
  function clamp(v) { return Math.min(max, Math.max(0, v)); }
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

// "···" меню действий строки (Изменить / Удалить) — закрывается по клику снаружи или Esc
//
// Раньше меню позиционировалось position:absolute внутри строки, а строка лежит
// внутри .timers-table с overflow:hidden (это нужно для скруглённых углов таблицы).
// Из-за этого у нижних строк выпадающий список обрезался этим overflow и был не
// виден. Теперь меню рисуется через position:fixed по координатам самой кнопки —
// оно всегда поверх всего и не зависит от overflow родителей.
function RowActionsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  function openMenu() {
    const rect = btnRef.current.getBoundingClientRect();
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
    function onDocClick(e) {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
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

// Компактный редактируемый "Период" прямо в столбце таблицы — три коротких
// поля дн./ч./мин. без стрелок (не помещаются в узкую колонку). Правки не
// летят на сервер при каждом нажатии клавиши — небольшой debounce, а дальше
// как и раньше в модалке: если период уменьшили меньше текущего остатка,
// остаток подрезаем, чтобы прогресс-бар не зашкаливал.
function PeriodInlineEdit({ timer, onEdit }) {
  const [days, setDays] = useState(Math.floor(timer.period_seconds / 86400));
  const [hours, setHours] = useState(Math.floor((timer.period_seconds % 86400) / 3600));
  const [minutes, setMinutes] = useState(Math.floor((timer.period_seconds % 3600) / 60));
  const pendingRef = useRef(false);
  const debounceRef = useRef(null);

  // Подхватываем период, если он поменялся снаружи (автообновление раз в 30с,
  // правка на другой вкладке) — но не пока пользователь сам сейчас печатает.
  useEffect(() => {
    if (pendingRef.current) return;
    setDays(Math.floor(timer.period_seconds / 86400));
    setHours(Math.floor((timer.period_seconds % 86400) / 3600));
    setMinutes(Math.floor((timer.period_seconds % 3600) / 60));
  }, [timer.period_seconds]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function commit(nextDays, nextHours, nextMinutes) {
    setDays(nextDays);
    setHours(nextHours);
    setMinutes(nextMinutes);
    pendingRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pendingRef.current = false;
      const newPeriodSeconds = nextDays * 86400 + nextHours * 3600 + nextMinutes * 60;
      if (newPeriodSeconds < 60) return; // период меньше минуты не отправляем
      const currentRemaining = getRemaining(timer);
      const clampedRemaining = currentRemaining === null
        ? newPeriodSeconds
        : Math.min(Math.max(0, Math.round(currentRemaining)), newPeriodSeconds);
      onEdit(timer.id, { period_seconds: newPeriodSeconds, remaining_seconds: clampedRemaining });
    }, 500);
  }

  return (
    <div className="timer-row-period-edit" title="Период таймера">
      <input
        className="timer-row-period-num" type="number" min="0" max="999"
        value={days} onFocus={e => e.target.select()}
        onChange={e => commit(Math.max(0, parseInt(e.target.value) || 0), hours, minutes)}
      />
      <span className="timer-row-period-unit">д</span>
      <input
        className="timer-row-period-num" type="number" min="0" max="23"
        value={hours} onFocus={e => e.target.select()}
        onChange={e => commit(days, Math.min(23, Math.max(0, parseInt(e.target.value) || 0)), minutes)}
      />
      <span className="timer-row-period-unit">ч</span>
      <input
        className="timer-row-period-num" type="number" min="0" max="59"
        value={minutes} onFocus={e => e.target.select()}
        onChange={e => commit(days, hours, Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
      />
      <span className="timer-row-period-unit">м</span>
    </div>
  );
}

// ── Модалка редактирования таймера (название + оставшееся время) ──
function EditTimerModal({ timer, onCommit, onClose }) {
  const [name, setName] = useState(timer.name);

  // Оставшееся время — отдельное поле, не связанное с периодом. Предзаполняем
  // тем, сколько реально осталось прямо сейчас (а не полным периодом), чтобы
  // можно было точечно поправить его, например если забыли вовремя нажать
  // "Обновить" и таймер утёк на лишний час.
  const initialRemaining = (() => {
    const r = getRemaining(timer);
    if (r === null) return timer.period_seconds;
    return Math.max(0, Math.round(r));
  })();
  const [remDays, setRemDays] = useState(Math.floor(initialRemaining / 86400));
  const [remHours, setRemHours] = useState(Math.floor((initialRemaining % 86400) / 3600));
  const [remMinutes, setRemMinutes] = useState(Math.floor((initialRemaining % 3600) / 60));

  const [error, setError] = useState('');

  // Правим "Осталось до конца" → пересчитываем поле точного времени.
  // Период здесь больше не редактируется (это теперь делается прямо в
  // таблице), поэтому используем неизменный timer.period_seconds.
  function updateRemaining(nextRemDays, nextRemHours, nextRemMinutes) {
    setRemDays(nextRemDays);
    setRemHours(nextRemHours);
    setRemMinutes(nextRemMinutes);
  }

  function handleSubmit() {
    if (!name.trim()) { setError('Введите название таймера'); return; }
    const remainingSeconds = remDays * 86400 + remHours * 3600 + remMinutes * 60;
    onCommit({ name: name.trim(), remaining_seconds: remainingSeconds });
    onClose();
  }

  function onKey(e) {
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

          <label className="modal-label">
            Осталось до события
            <InfoTip text="Поправьте, если забыли вовремя нажать «Обновить» — период при этом не изменится" />
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

function TimerRow({
  timer, index, onReset, onEdit, onDelete, onToggleSound,
  dragState, onDragStart, onDragOver, onDrop, onDragEnd,
  registerRowRef, justDroppedId,
}) {
  const [, setTick] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = getRemaining(timer);
  const forecast = getForecast(timer);
  const isExpired = remaining !== null && remaining <= 0;
  const isEmpty = remaining === null;

  // Звук по истечении теперь проигрывает только глобальный вотчер
  // (useGlobalSoundWatcher, живёт на уровне App) — он срабатывает независимо
  // от открытой вкладки. Раньше эта страница ещё и сама проигрывала сигнал,
  // из-за чего на вкладке "Таймеры" звук звучал дважды.

  const progressPct = remaining !== null
    ? Math.min(100, Math.max(0, (remaining / timer.period_seconds) * 100))
    : 0;
  // Кольцо теперь заполняется зелёным по мере прохождения времени (а не
  // "убывает" от полного круга к пустому) — так нагляднее читается
  // приближение к завершению отсчёта.
  const elapsedPct = 100 - progressPct;

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
        <div className="timer-row-name">
          <span className="timer-row-name-text">{timer.name}</span>
        </div>
        <div className="timer-row-period">
          <PeriodInlineEdit timer={timer} onEdit={onEdit} />
        </div>
        <div className={`timer-row-remaining ${isExpired ? 'expired' : isEmpty ? 'empty' : ''}`}>
          <div
            className="timer-row-ring"
            style={{
              background: isEmpty
                ? 'conic-gradient(var(--border) 0 100%)'
                : isExpired
                  ? 'conic-gradient(var(--red) 0 100%)'
                  : `conic-gradient(var(--green) ${elapsedPct}%, var(--bg3) ${elapsedPct}% 100%)`
            }}
          >
            <div className="timer-row-ring-hole" />
          </div>
          <span className="timer-row-remaining-text">
            {isEmpty ? '-- : -- : --' : isExpired ? '⚡ Готово!' : formatDuration(remaining)}
          </span>
        </div>
        <div className="timer-row-forecast">
          {isEmpty ? '-- : -- : --' : isExpired ? 'Уже!' :
            forecast.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="timer-row-actions">
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
      </div>

      {/* Mobile card — редизайн: отдельная "плитка" на таймер с кольцом-циферблатом
          вместо плоского списка со строкой-прогрессбаром снизу. Кольцо строится
          на conic-gradient и даёт мгновенное визуальное чтение остатка (как
          индикатор заряда), а не просто полоску. */}
      <div className={`timer-mcard ${isExpired ? 'timer-mcard-expired' : ''} ${isEmpty ? 'timer-mcard-empty' : ''}`}>
        <div className="timer-mcard-head">
          <span className="timer-mcard-name">{timer.name}</span>
          <RowActionsMenu onEdit={() => setShowEdit(true)} onDelete={() => onDelete(timer.id)} />
        </div>

        <div className="timer-mcard-body">
          <div
            className="timer-mcard-ring"
            style={{
              background: isEmpty
                ? 'conic-gradient(var(--border) 0 100%)'
                : isExpired
                  ? 'conic-gradient(var(--red) 0 100%)'
                  : `conic-gradient(var(--green) ${elapsedPct}%, var(--bg3) ${elapsedPct}% 100%)`
            }}
          >
            <div className="timer-mcard-ring-hole">
              {isExpired ? '⚡' : isEmpty ? '–' : '⏳'}
            </div>
          </div>

          <div className="timer-mcard-info">
            <div className={`timer-mcard-time ${isExpired ? 'expired' : isEmpty ? 'empty' : ''}`}>
              {isEmpty ? '--:--:--' : isExpired ? 'Готово!' : formatDuration(remaining)}
            </div>
            <div className="timer-mcard-sub">
              <span className="timer-mcard-period-tag">каждые {formatDuration(timer.period_seconds)}</span>
              <span className="timer-mcard-forecast">
                🎯 {isEmpty ? '--:--' : isExpired ? 'уже!' : forecast.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="timer-mcard-actions">
          <button className="btn btn-reset timer-mcard-reset-btn btn-anim" onClick={() => onReset(timer.id)}>
            <RefreshIcon size={15} /> Обновить
          </button>
          <button
            className={`rupor-btn timer-mcard-sound-btn ${timer.sound_enabled ? 'rupor-on' : 'rupor-off'}`}
            onClick={() => onToggleSound(timer)}
            title={timer.sound_enabled ? 'Звук по окончании включён' : 'Звук по окончании выключен'}
          >
            <SoundIcon on={timer.sound_enabled} />
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

export default function TimersPage({ user, onLoginClick }) {
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
    if (!user) { setLoading(false); return; }
    try {
      const data = await api.get('/timers');
      setTimers(data.timers);
    } catch (e) {
      setError(e.message);
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
    <div className="page">
      <div>
        <div className="page-title">⏱️ Таймеры</div>
        <div className="page-subtitle">Создавайте таймеры, отслеживайте время и получайте уведомления</div>
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
