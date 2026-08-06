import { useState, useEffect, useCallback, useRef, ReactNode, RefObject, CSSProperties, KeyboardEvent, MouseEvent, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../utils/api';
import InfoSpoiler from '../../components/InfoSpoiler';
import GuestLock from '../../components/GuestLock';
import { HEARTS_SPOILER } from '../../content/spoilerContent';
import type { Clan, ClanMemberSummary, AuthUser, LootParticipant } from '../../types/entities';

// Локальная форма участника учёта лута — совпадает с LootParticipant,
// кроме sold_for: во время редактирования поля "Продали за" сервис (и, в
// точности так же, локальный оптимистичный апдейт ниже) принимает '' как
// сигнал "очистить это поле", поэтому в состоянии это временно строка,
// а не только number|null.
type HeartsParticipant = Omit<LootParticipant, 'sold_for'> & { sold_for: number | string | null };

interface HeartsUpdateFields {
  hearts?: number;
  pelts?: number;
  sold_for?: number | string | null;
  finders?: string[];
  paid_out?: string[];
}

// ─── Портал-дропдаун (рендерится в body, не обрезается таблицей) ──────
function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

function useDropdownPos(triggerRef: RefObject<HTMLElement | null>, open: boolean): DropdownPos {
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
      width: r.width,
    });
  }, [open, triggerRef]);
  return pos;
}

interface AddParticipantPayload {
  nick: string;
  user_id: number | null;
}

// ─── Дропдаун добавления участника в таблицу ──────────────────────────
interface AddParticipantDropdownProps {
  anchorRef: RefObject<HTMLElement | null>;
  members: ClanMemberSummary[];
  onAdd: (p: AddParticipantPayload) => void;
  onClose: () => void;
}

function AddParticipantDropdown({ anchorRef, members, onAdd, onClose }: AddParticipantDropdownProps) {
  const [search, setSearch] = useState('');
  const [customNick, setCustomNick] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const pos = useDropdownPos(anchorRef, true);

  useEffect(() => {
    function h(e: globalThis.MouseEvent) {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) &&
          anchorRef.current && !anchorRef.current.contains(target)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose, anchorRef]);

  const filtered = members.filter(m => {
    const nick = m.game_nick || m.nick;
    return nick.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Portal>
      <div ref={ref} style={{
        position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.7)',
        minWidth: 260, overflow: 'hidden',
      }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
            👥 Участники клана
          </div>
          <input autoFocus
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '5px 8px', fontSize: 13 }}
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>
              {members.length === 0 ? 'Нет участников' : 'Все уже добавлены'}
            </div>
          )}
          {filtered.map(m => {
            const nick = m.game_nick || m.nick;
            return (
              <div key={m.id} onClick={() => { onAdd({ nick, user_id: m.id }); onClose(); }}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <span>🐻</span><span>{nick}</span>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,.15)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
            ✍️ Вписать ник вручную
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '5px 8px', fontSize: 13 }}
              placeholder="Ник игрока..."
              value={customNick}
              onChange={e => setCustomNick(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customNick.trim()) { onAdd({ nick: customNick.trim(), user_id: null }); onClose(); } }}
            />
            <button
              onClick={() => { if (customNick.trim()) { onAdd({ nick: customNick.trim(), user_id: null }); onClose(); } }}
              disabled={!customNick.trim()}
              style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 13,
                background: customNick.trim() ? 'var(--accent)' : 'var(--bg3)',
                color: customNick.trim() ? '#0d1117' : 'var(--text3)',
                cursor: customNick.trim() ? 'pointer' : 'default' }}
            >OK</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Дропдаун «кто нашёл» — через портал ─────────────────────────────
interface FindersDropdownProps {
  anchorRef: RefObject<HTMLElement | null>;
  members: ClanMemberSummary[];
  finders: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
}

function FindersDropdown({ anchorRef, members, finders, onChange, onClose }: FindersDropdownProps) {
  const [customNick, setCustomNick] = useState('');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const pos = useDropdownPos(anchorRef, true);

  useEffect(() => {
    function h(e: globalThis.MouseEvent) {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) &&
          anchorRef.current && !anchorRef.current.contains(target)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose, anchorRef]);

  const findersSet = new Set(finders);

  function toggle(nick: string) {
    onChange(findersSet.has(nick) ? finders.filter(f => f !== nick) : [...finders, nick]);
  }
  function addCustom() {
    const n = customNick.trim();
    if (!n || findersSet.has(n)) return;
    onChange([...finders, n]);
    setCustomNick('');
  }

  const filtered = members.filter(m =>
    (m.game_nick || m.nick).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Portal>
      <div ref={ref} style={{
        position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.7)',
        minWidth: 240, overflow: 'hidden',
      }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
            👥 Кто нашёл — клан
          </div>
          <input autoFocus
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '5px 8px', fontSize: 13 }}
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
          {filtered.map(m => {
            const nick = m.game_nick || m.nick;
            const checked = findersSet.has(nick);
            return (
              <div key={m.id} onClick={() => toggle(nick)}
                style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 13,
                  color: checked ? 'var(--accent)' : 'var(--text)',
                  background: checked ? 'rgba(88,166,255,.07)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => (e.currentTarget.style.background = checked ? 'rgba(88,166,255,.12)' : 'var(--bg3)')}
                onMouseLeave={e => (e.currentTarget.style.background = checked ? 'rgba(88,166,255,.07)' : 'transparent')}
              >
                <span style={{ fontSize: 13, width: 16, color: 'var(--accent)' }}>{checked ? '✓' : ''}</span>
                <span>{nick}</span>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>Никого нет</div>}
        </div>
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,.15)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
            ✍️ Вписать вручную
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '5px 8px', fontSize: 13 }}
              placeholder="Ник..."
              value={customNick}
              onChange={e => setCustomNick(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
            />
            <button onClick={addCustom} disabled={!customNick.trim()}
              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 13,
                background: customNick.trim() ? 'var(--accent)' : 'var(--bg3)',
                color: customNick.trim() ? '#0d1117' : 'var(--text3)',
                cursor: customNick.trim() ? 'pointer' : 'default' }}
            >+</button>
          </div>
          {finders.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {finders.map(f => (
                <span key={f} onClick={() => toggle(f)} style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 10,
                  background: 'rgba(88,166,255,.15)', color: 'var(--accent)',
                  cursor: 'pointer', border: '1px solid rgba(88,166,255,.3)',
                }}>{f} ×</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ─── Форматирование числа с пробелами: 3000000 → 3 000 000 ──────────
function fmt(n: number | string | null | undefined): string {
  if (n == null || n === '') return '';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// ─── Кнопки ± ────────────────────────────────────────────────────────
interface CounterProps {
  value: number;
  onChange: (v: number) => void;
  color: string;
  disabled?: boolean;
}

function Counter({ value, onChange, color, disabled }: CounterProps) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: disabled ? 0.75 : 1 }}
      title={disabled ? 'Редактировать может только тот, чей ник указан в строке' : undefined}
    >
      <button
        disabled={disabled}
        onClick={() => !disabled && onChange(Math.max(0, value - 1))}
        style={{
          width: 26, height: 26, borderRadius: 5, border: '1px solid var(--border)',
          background: 'var(--bg3)', color: 'var(--text)', cursor: disabled ? 'default' : 'pointer',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600,
        }}>−</button>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color, minWidth: 22, textAlign: 'center' }}>
        {value}
      </span>
      <button
        disabled={disabled}
        onClick={() => !disabled && onChange(value + 1)}
        style={{
          width: 26, height: 26, borderRadius: 5, border: '1px solid var(--border)',
          background: 'var(--bg3)', color: 'var(--text)', cursor: disabled ? 'default' : 'pointer',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600,
        }}>+</button>
      <span style={{ fontSize: 11, marginLeft: 1, width: 13, display: 'inline-block', textAlign: 'center', visibility: disabled ? 'visible' : 'hidden' }}>🔒</span>
    </div>
  );
}

// ─── Ячейка «Выплачено участникам» — чек-лист по каждому из «Участников» ──
interface PaidOutCellProps {
  finders: string[];
  paidOut: string[];
  isOwner: boolean;
  onUpdate: (id: number, fields: HeartsUpdateFields) => void;
  p: HeartsParticipant;
}

function PaidOutCell({ finders, paidOut, isOwner, onUpdate, p }: PaidOutCellProps) {
  const paidSet = new Set(paidOut);

  function toggle(nick: string) {
    if (!isOwner) return;
    const next = paidSet.has(nick) ? paidOut.filter(n => n !== nick) : [...paidOut, nick];
    onUpdate(p.id, { paid_out: next });
  }

  if (finders.length === 0) {
    return <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
      {finders.map(f => {
        const paid = paidSet.has(f);
        return (
          <span
            key={f}
            onClick={() => toggle(f)}
            title={isOwner ? (paid ? 'Отметить как невыплачено' : 'Отметить как выплачено') : 'Редактировать может только тот, чей ник указан в строке'}
            style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 8,
              background: paid ? 'rgba(63,185,80,.15)' : 'rgba(255,255,255,.05)',
              color: paid ? '#3fb950' : 'var(--text3)',
              border: `1px solid ${paid ? 'rgba(63,185,80,.35)' : 'var(--border)'}`,
              cursor: isOwner ? 'pointer' : 'default',
              userSelect: 'none',
              opacity: isOwner ? 1 : 0.75,
            }}
          >{paid ? '✓ ' : ''}{f}</span>
        );
      })}
      <span style={{ fontSize: 11, marginLeft: 2, width: 13, display: 'inline-block', textAlign: 'center', visibility: !isOwner ? 'visible' : 'hidden' }}>🔒</span>
    </div>
  );
}

// ─── Строка участника ─────────────────────────────────────────────────
interface ParticipantRowProps {
  p: HeartsParticipant;
  onUpdate: (id: number, fields: HeartsUpdateFields) => void;
  onDelete: (id: number) => void;
  members: ClanMemberSummary[];
  canDelete: boolean;
  currentUserId: number | undefined;
}

function ParticipantRow({ p, onUpdate, onDelete, members, canDelete, currentUserId }: ParticipantRowProps) {
  const [soldInput, setSoldInput]     = useState(p.sold_for != null ? String(p.sold_for) : '');
  const [soldFocused, setSoldFocused] = useState(false);
  const [showFinders, setShowFinders] = useState(false);
  const findersBtnRef = useRef<HTMLDivElement>(null);

  const finders = Array.isArray(p.finders) ? p.finders : [];
  const paidOut = Array.isArray(p.paid_out) ? p.paid_out : [];
  // Редактировать «Сердца», «Шкуры», «Продали за», «Участники» и «Выплачено»
  // может только тот, чей аккаунт привязан к нику в этой строке (колонка
  // «НИК» → p.user_id). Гостевой ник (без аккаунта, метка «гость») —
  // за него некому залогиниться, поэтому редактировать его может любой
  // участник клана.
  const isOwner = p.user_id != null
    ? p.user_id === currentUserId
    : true;

  const dt = new Date(p.added_at);
  const dateStr = dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  // Доля = "Продали за" ÷ количество участников (finders) этой строки
  // Каждая строка считается независимо, сердца/шкуры на долю не влияют
  const shareRub = (() => {
    if (p.sold_for == null) return null;
    const count = finders.length;
    if (count === 0) return null;
    return Math.round(Number(p.sold_for) / count);
  })();
  const shareLabel = shareRub != null ? fmt(shareRub) + ' руб.' : '—';

  function handleSoldBlur() {
    setSoldFocused(false);
    // Убираем пробелы перед парсингом
    const raw = soldInput.replace(/\s/g, '').trim();
    const val = raw === '' ? null : parseInt(raw);
    if (val !== p.sold_for) onUpdate(p.id, { sold_for: raw === '' ? '' : val });
  }

  // При вводе — разрешаем только цифры и форматируем на лету
  function handleSoldChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\s/g, '');
    if (raw === '' || /^\d+$/.test(raw)) setSoldInput(raw);
  }

  return (
    <tr style={{ borderBottom: '1px solid rgba(48,54,61,.5)' }}>
      {/* ДАТА */}
      <td style={{ padding: '13px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{dateStr}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{timeStr}</div>
      </td>

      {/* НИК */}
      <td style={{ padding: '13px 10px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{p.nick}</span>
        {!p.user_id && (
          <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>гость</span>
        )}
      </td>

      {/* СЕРДЦА — редактирует только тот, чей ник указан в строке */}
      <td style={{ padding: '13px 10px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Counter value={p.hearts || 0} onChange={v => onUpdate(p.id, { hearts: v })} color="#e05252" disabled={!isOwner} />
        </div>
      </td>

      {/* ШКУРЫ — редактирует только тот, чей ник указан в строке */}
      <td style={{ padding: '13px 10px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Counter value={p.pelts || 0} onChange={v => onUpdate(p.id, { pelts: v })} color="#7eb8e0" disabled={!isOwner} />
        </div>
      </td>

      {/* ДОЛЯ */}
      <td style={{ padding: '13px 10px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: '#3fb950', whiteSpace: 'nowrap' }}>
          {shareLabel}
        </span>
      </td>

      {/* УЧАСТНИКИ — редактирует только тот, чей ник указан в строке */}
      <td style={{ padding: '13px 10px' }}>
        <div
          ref={findersBtnRef}
          onClick={() => { if (isOwner) setShowFinders(o => !o); }}
          title={!isOwner ? 'Редактировать может только тот, чей ник указан в строке' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
            cursor: isOwner ? 'pointer' : 'default', padding: '5px 8px', borderRadius: 6,
            border: `1px solid ${showFinders ? 'var(--accent)' : 'var(--border)'}`,
            background: showFinders ? 'rgba(88,166,255,.06)' : 'var(--bg3)',
            width: '100%', boxSizing: 'border-box', minHeight: 30, transition: 'all .15s',
            opacity: isOwner ? 1 : 0.75,
          }}
        >
          {finders.length === 0
            ? <span style={{ fontSize: 12, color: 'var(--text3)' }}>{isOwner ? 'Выбрать...' : '—'}</span>
            : finders.map(f => (
              <span key={f} style={{
                fontSize: 11, padding: '1px 6px', borderRadius: 8,
                background: 'rgba(88,166,255,.15)', color: 'var(--accent)',
                border: '1px solid rgba(88,166,255,.25)',
              }}>{f}</span>
            ))
          }
          <span style={{ marginLeft: 'auto', fontSize: 11, paddingLeft: 4, width: 13, textAlign: 'center', display: 'inline-block' }}>
            {isOwner ? <span style={{ fontSize: 9, color: 'var(--text3)' }}>▼</span> : '🔒'}
          </span>
        </div>
        {showFinders && isOwner && (
          <FindersDropdown
            anchorRef={findersBtnRef}
            members={members}
            finders={finders}
            onChange={next => onUpdate(p.id, { finders: next })}
            onClose={() => setShowFinders(false)}
          />
        )}
      </td>

      {/* ВЫПЛАЧЕНО УЧАСТНИКАМ — редактирует только тот, чей ник указан в строке */}
      <td style={{ padding: '13px 10px' }}>
        <PaidOutCell p={p} finders={finders} paidOut={paidOut} isOwner={isOwner} onUpdate={onUpdate} />
      </td>

      {/* ПРОДАЛИ ЗА — редактирует только тот, чей ник указан в строке */}
      <td style={{ padding: '13px 10px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title={!isOwner ? 'Редактировать может только тот, чей ник указан в строке' : undefined}
        >
          <input
            type="text"
            inputMode="numeric"
            value={soldFocused ? fmt(soldInput) : (p.sold_for != null ? fmt(p.sold_for) : '')}
            placeholder="—"
            disabled={!isOwner}
            onFocus={() => { setSoldFocused(true); setSoldInput(p.sold_for != null ? String(p.sold_for) : ''); }}
            onBlur={handleSoldBlur}
            onChange={handleSoldChange}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            style={{
              width: 110, background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', padding: '5px 8px',
              fontSize: 14, fontFamily: 'var(--font-mono)',
              opacity: isOwner ? 1 : 0.75,
              cursor: isOwner ? 'text' : 'default',
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>руб.</span>
          <span style={{ fontSize: 11, width: 13, display: 'inline-block', textAlign: 'center', visibility: !isOwner ? 'visible' : 'hidden' }}>🔒</span>
        </div>
      </td>

      {/* Удалить — только лидер и зам */}
      <td style={{ padding: '13px 6px', textAlign: 'center' }}>
        {canDelete && (
          <button onClick={() => onDelete(p.id)} title="Удалить" style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            cursor: 'pointer', fontSize: 20, lineHeight: 1, opacity: 0.45, padding: '0 2px',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}
          >×</button>
        )}
      </td>
    </tr>
  );
}

interface HeartsPageProps {
  clan: Clan | null;
  members: ClanMemberSummary[];
  user: AuthUser | null;
  onHeartsUpdate?: (reload: () => Promise<void>) => void;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

// ─── Колонки таблицы — единый источник правды для ширин и выравнивания.
// table-layout: fixed + <colgroup> гарантируют, что заголовок и данные
// всегда стоят строго друг под другом, независимо от содержимого ячеек.
interface ColumnDef {
  key: string;
  label: string;
  width: number;
  align: 'left' | 'center';
}

const COLUMNS: ColumnDef[] = [
  { key: 'date',    label: 'ДАТА',                     width: 92,  align: 'center' },
  { key: 'nick',    label: 'НИК',                      width: 130, align: 'left' },
  { key: 'hearts',  label: '❤️ СЕРДЦА',                width: 120, align: 'center' },
  { key: 'pelts',   label: '🧥 ШКУРЫ',                 width: 120, align: 'center' },
  { key: 'share',   label: '💰 ДОЛЯ',                  width: 100, align: 'center' },
  { key: 'finders', label: '👥 УЧАСТНИКИ',             width: 210, align: 'left' },
  { key: 'paidout', label: '💸 ВЫПЛАЧЕНО УЧАСТНИКАМ',  width: 200, align: 'left' },
  { key: 'sold',    label: '💵 ПРОДАЛИ ЗА',            width: 160, align: 'left' },
  { key: 'del',     label: '',                         width: 40,  align: 'center' },
];
const TABLE_WIDTH = COLUMNS.reduce((s, c) => s + c.width, 0);

// ─── Основная страница ────────────────────────────────────────────────
export default function HeartsPage({ clan, members, user, onHeartsUpdate, isGuest, onLoginClick = () => {} }: HeartsPageProps) {
  const [participants, setParticipants] = useState<HeartsParticipant[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [error, setError]               = useState('');
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    if (!clan) { setLoading(false); return; }
    try {
      const data = await api.get('/hearts');
      setParticipants(data.participants || []);
    } catch { setError('Ошибка загрузки'); }
    finally { setLoading(false); }
  }, [clan]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (onHeartsUpdate) onHeartsUpdate(load); }, [onHeartsUpdate, load]);

  async function handleAdd({ nick, user_id }: AddParticipantPayload) {
    setError('');
    try { await api.post('/hearts/participant', { nick, user_id }); await load(); }
    catch (e) { setError((e as Error).message); }
  }

  async function handleUpdate(id: number, fields: HeartsUpdateFields) {
    const clamped: HeartsUpdateFields = { ...fields };
    if (clamped.hearts !== undefined) clamped.hearts = Math.max(0, clamped.hearts);
    if (clamped.pelts  !== undefined) clamped.pelts  = Math.max(0, clamped.pelts);
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...clamped } : p));
    try { await api.patch(`/hearts/${id}`, clamped); }
    catch (e) { setError((e as Error).message); load(); }
  }

  async function handleDelete(id: number) {
    try { await api.delete(`/hearts/${id}`); setParticipants(prev => prev.filter(p => p.id !== id)); }
    catch (e) { setError((e as Error).message); }
  }

  const totalHearts   = participants.reduce((s, p) => s + (p.hearts || 0), 0);
  const totalPelts    = participants.reduce((s, p) => s + (p.pelts  || 0), 0);
  // Только лидер (owner) и зам (deputy) могут удалять строки
  const canDelete = !!(clan && user && (clan.owner_id === user.id || clan.deputy_id === user.id));
  // Новые строки сверху
  const sorted = [...participants].sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">🫀 Учёт лута</h2>
        <InfoSpoiler {...HEARTS_SPOILER} storageKey="spoiler_hearts" />
        {isGuest ? (
          <GuestLock
            icon="❤️"
            title="Веди учёт добычи вместе с кланом"
            text="Автоматический расчёт долей и история добычи доступны после регистрации и вступления в клан."
            onLoginClick={onLoginClick}
          />
        ) : (
          <div className="empty-state"><p>Вступи в клан чтобы вести учёт</p></div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="bears-hdr">
        <h2 className="page-title">🫀 Учёт лута — {clan.name}</h2>
        <div className="stat-pills">
          <span className="pill" style={{ color: '#e05252', borderColor: '#e05252', background: 'rgba(224,82,82,.1)' }}>❤️ Сердец: {totalHearts}</span>
          <span className="pill" style={{ color: '#7eb8e0', borderColor: '#7eb8e0', background: 'rgba(126,184,224,.1)' }}>🧥 Шкур: {totalPelts}</span>
          <span className="pill">👥 Участников: {participants.length}</span>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: 'var(--red)', padding: '8px 12px', background: 'rgba(248,81,73,.08)', borderRadius: 8, border: '1px solid rgba(248,81,73,.2)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Пояснение как пользоваться таблицей и как работает защита строк — сворачиваемый спойлер */}
      <InfoSpoiler {...HEARTS_SPOILER} storageKey="spoiler_hearts" />

      {/* Таблица — без overflow:hidden чтобы дропдауны (порталы) не обрезались */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: TABLE_WIDTH, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            {/* colgroup — единственный источник ширины колонок: шапка и
                строки физически не могут разъехаться, т.к. обе читают
                ширину из одних и тех же <col> */}
            <colgroup>
              {COLUMNS.map(c => <col key={c.key} style={{ width: c.width }} />)}
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {COLUMNS.map(c => (
                  <th key={c.key} style={{ ...th, textAlign: c.align, whiteSpace: c.label.length > 12 ? 'normal' : 'nowrap' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Загрузка...</td></tr>
              ) : participants.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--text3)', fontSize: 13 }}>
                  Нажми «+ Добавить участника» чтобы начать учёт
                </td></tr>
              ) : (
                sorted.map(p => (
                  <ParticipantRow
                    key={p.id} p={p}
                    onUpdate={handleUpdate} onDelete={handleDelete}
                    members={members} canDelete={canDelete}
                    currentUserId={user ? user.id : undefined}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Нижняя панель */}
        <div style={{
          borderTop: '1px solid var(--border)', padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(0,0,0,.1)', borderRadius: '0 0 10px 10px',
        }}>
          <div style={{ position: 'relative' }}>
            <button ref={addBtnRef} onClick={() => setShowAdd(o => !o)}
              className={showAdd ? '' : 'btn-shiny'}
              style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              ...(showAdd ? { background: 'var(--bg3)', color: 'var(--text)', border: 'none' } : {}),
              cursor: 'pointer', transition: 'all .15s',
            }}>
              + Добавить участника
            </button>
            {showAdd && (
              <AddParticipantDropdown
                anchorRef={addBtnRef}
                members={members}
                onAdd={handleAdd}
                onClose={() => setShowAdd(false)}
              />
            )}
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>

      <div className="tbl-hint">
        ❤️ + шкуры 🧥 = доля считается автоматически · «Участники» и «Выплачено участникам» редактирует только тот, чей ник указан в строке · «Очистить рейд» сбрасывает таблицу
      </div>
    </div>
  );
}

const th: CSSProperties = {
  padding: '10px 12px',
  fontSize: 12, fontWeight: 600,
  color: 'var(--text2)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  lineHeight: 1.35,
};
