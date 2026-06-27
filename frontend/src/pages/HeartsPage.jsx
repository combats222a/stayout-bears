import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

// ─── Дропдаун добавления участника ────────────────────────────────────
function AddParticipantDropdown({ members, existingNicks, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const [customNick, setCustomNick] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const filtered = members.filter(m => {
    const nick = m.game_nick || m.nick;
    return (
      nick.toLowerCase().includes(search.toLowerCase()) &&
      !existingNicks.has(nick)
    );
  });

  function addMember(m) {
    onAdd({ nick: m.game_nick || m.nick, user_id: m.id });
    onClose();
  }
  function addCustom() {
    const n = customNick.trim();
    if (!n) return;
    onAdd({ nick: n, user_id: null });
    setCustomNick('');
    onClose();
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300,
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.6)',
      minWidth: 260, overflow: 'hidden',
    }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
          👥 Участники клана
        </div>
        <input
          autoFocus
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
            <div key={m.id} onClick={() => addMember(m)} style={{
              padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
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
            onKeyDown={e => e.key === 'Enter' && addCustom()}
          />
          <button onClick={addCustom} disabled={!customNick.trim()} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 13,
            background: customNick.trim() ? 'var(--accent)' : 'var(--bg3)',
            color: customNick.trim() ? '#0d1117' : 'var(--text3)',
            cursor: customNick.trim() ? 'pointer' : 'default',
          }}>OK</button>
        </div>
      </div>
    </div>
  );
}

// ─── Кнопки ± ────────────────────────────────────────────────────────
function Counter({ value, onChange, color = '#e05252' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onChange(value - 1)} style={{
        width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border)',
        background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>−</button>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color, minWidth: 18, textAlign: 'center' }}>
        {value}
      </span>
      <button onClick={() => onChange(value + 1)} style={{
        width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border)',
        background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>+</button>
    </div>
  );
}

// ─── Строка участника ─────────────────────────────────────────────────
function ParticipantRow({ p, rank, totalHearts, totalPelts, onUpdate, onDelete }) {
  const [soldInput, setSoldInput] = useState(p.sold_for != null ? String(p.sold_for) : '');
  const [soldFocused, setSoldFocused] = useState(false);

  // Доля — пропорционально суммарному лоту (сердца + шкуры)
  const myLoot = p.hearts + p.pelts;
  const totalLoot = totalHearts + totalPelts;
  const shareLabel = totalLoot > 0
    ? Math.round((myLoot / totalLoot) * 100) + '%'
    : '—';

  // Расчёт выплаты — если есть sold_for у кого-то в таблице, пересчитывается
  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : null;

  function handleSoldBlur() {
    setSoldFocused(false);
    const val = soldInput.trim() === '' ? null : parseInt(soldInput);
    if (val !== p.sold_for) {
      onUpdate(p.id, { sold_for: soldInput.trim() === '' ? '' : val });
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid rgba(48,54,61,.5)' }}>
      {/* # */}
      <td style={{ padding: '10px 10px', width: 36, color: 'var(--text3)', fontSize: 13 }}>
        {medal || <span>{rank + 1}</span>}
      </td>

      {/* НИК */}
      <td style={{ padding: '10px 6px' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{p.nick}</span>
        {!p.user_id && (
          <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>
            гость
          </span>
        )}
      </td>

      {/* СЕРДЦА */}
      <td style={{ padding: '10px 6px' }}>
        <Counter value={p.hearts} onChange={v => onUpdate(p.id, { hearts: v })} color="#e05252" />
      </td>

      {/* ШКУРЫ */}
      <td style={{ padding: '10px 6px' }}>
        <Counter value={p.pelts} onChange={v => onUpdate(p.id, { pelts: v })} color="#7eb8e0" />
      </td>

      {/* ДОЛЯ */}
      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: '#3fb950' }}>
          {shareLabel}
        </span>
      </td>

      {/* ПРОДАЛИ ЗА */}
      <td style={{ padding: '10px 6px', minWidth: 130 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="number"
            value={soldFocused ? soldInput : (p.sold_for != null ? String(p.sold_for) : '')}
            placeholder="—"
            onFocus={() => { setSoldFocused(true); setSoldInput(p.sold_for != null ? String(p.sold_for) : ''); }}
            onBlur={handleSoldBlur}
            onChange={e => setSoldInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
            style={{
              width: 90, background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', padding: '4px 8px',
              fontSize: 13, fontFamily: 'var(--font-mono)',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>руб.</span>
        </div>
      </td>

      {/* Удалить */}
      <td style={{ padding: '10px 6px', textAlign: 'center', width: 32 }}>
        <button onClick={() => onDelete(p.id)} title="Удалить" style={{
          background: 'none', border: 'none', color: 'var(--text3)',
          cursor: 'pointer', fontSize: 18, lineHeight: 1, opacity: 0.5,
          transition: 'opacity .15s', padding: '0 4px',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
        >×</button>
      </td>
    </tr>
  );
}

// ─── Основная страница ────────────────────────────────────────────────
export default function HeartsPage({ clan, members, onHeartsUpdate }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const addBtnRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/hearts');
      setParticipants(data.participants || []);
    } catch { setError('Ошибка загрузки'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (onHeartsUpdate) onHeartsUpdate(load); }, [onHeartsUpdate, load]);

  async function handleAdd({ nick, user_id }) {
    setError('');
    try {
      await api.post('/hearts/participant', { nick, user_id });
      await load();
    } catch (e) { setError(e.message); }
  }

  async function handleUpdate(id, fields) {
    // Оптимистично обновляем локально
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
    try {
      await api.patch(`/hearts/${id}`, fields);
      // Не перезагружаем — сокет сделает это для других участников
    } catch (e) { setError(e.message); load(); }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/hearts/${id}`);
      setParticipants(prev => prev.filter(p => p.id !== id));
    } catch (e) { setError(e.message); }
  }

  async function handleReset() {
    if (!window.confirm('Очистить таблицу рейда?')) return;
    try {
      await api.post('/hearts/reset');
      setParticipants([]);
    } catch (e) { setError(e.message); }
  }

  const existingNicks = new Set(participants.map(p => p.nick));
  const totalHearts = participants.reduce((s, p) => s + (p.hearts || 0), 0);
  const totalPelts  = participants.reduce((s, p) => s + (p.pelts  || 0), 0);

  // Сортировка по сумме лута (убывание)
  const sorted = [...participants].sort((a, b) => (b.hearts + b.pelts) - (a.hearts + a.pelts));

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">🫀 Учёт лута</h2>
        <div className="empty-state"><p>Вступи в клан чтобы вести учёт</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Заголовок */}
      <div className="bears-hdr">
        <h2 className="page-title">🫀 Учёт лута — {clan.name}</h2>
        <div className="stat-pills">
          <span className="pill" style={{ color: '#e05252', borderColor: '#e05252', background: 'rgba(224,82,82,.1)' }}>
            ❤️ Сердец: {totalHearts}
          </span>
          <span className="pill" style={{ color: '#7eb8e0', borderColor: '#7eb8e0', background: 'rgba(126,184,224,.1)' }}>
            🧥 Шкур: {totalPelts}
          </span>
          <span className="pill">
            👥 Участников: {participants.length}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: 'var(--red)', padding: '8px 12px', background: 'rgba(248,81,73,.08)', borderRadius: 8, border: '1px solid rgba(248,81,73,.2)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Таблица */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
              <th style={th}>#</th>
              <th style={{ ...th, textAlign: 'left' }}>НИК</th>
              <th style={th}>❤️ СЕРДЦА</th>
              <th style={th}>🧥 ШКУРЫ</th>
              <th style={th}>💰 ДОЛЯ</th>
              <th style={th}>💸 ПРОДАЛИ ЗА</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Загрузка...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text3)', fontSize: 13 }}>
                Нажми «+ Добавить участника» чтобы начать учёт
              </td></tr>
            ) : (
              sorted.map((p, idx) => (
                <ParticipantRow
                  key={p.id}
                  p={p}
                  rank={idx}
                  totalHearts={totalHearts}
                  totalPelts={totalPelts}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Нижняя панель — добавить + сброс */}
        <div style={{
          borderTop: '1px solid var(--border)', padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          background: 'rgba(0,0,0,.1)',
        }}>
          <div ref={addBtnRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAdd(o => !o)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: showAdd ? 'var(--bg3)' : 'var(--accent)',
                color: showAdd ? 'var(--text)' : '#0d1117',
                border: 'none', cursor: 'pointer', transition: 'all .15s',
              }}
            >
              + Добавить участника
            </button>
            {showAdd && (
              <AddParticipantDropdown
                members={members}
                existingNicks={existingNicks}
                onAdd={handleAdd}
                onClose={() => setShowAdd(false)}
              />
            )}
          </div>

          <div style={{ flex: 1 }} />

          {participants.length > 0 && (
            <button onClick={handleReset} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13,
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text3)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
            >
              🗑 Очистить рейд
            </button>
          )}
        </div>
      </div>

      <div className="tbl-hint">
        ❤️ + шкуры 🧥 = доля считается автоматически · Нажми «Продали за» чтобы вписать сумму · «Очистить рейд» — сброс таблицы после рейда
      </div>
    </div>
  );
}

const th = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  textAlign: 'center',
  whiteSpace: 'nowrap',
};
