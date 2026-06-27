import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

// ─── Дропдаун выбора "кто нашёл сердце" ─────────────────────────────
function FinderDropdown({ members, value, onChange, onClose }) {
  const [search, setSearch] = useState('');
  const [customNick, setCustomNick] = useState('');
  const ref = useRef(null);

  // Закрыть при клике вне
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = members.filter(m => {
    const nick = m.game_nick || m.nick;
    return nick.toLowerCase().includes(search.toLowerCase());
  });

  function selectMember(m) {
    onChange({ user_id: m.id, nick: m.game_nick || m.nick });
    onClose();
  }

  function selectCustom() {
    const nick = customNick.trim();
    if (!nick) return;
    onChange({ user_id: null, nick });
    onClose();
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,.5)',
      overflow: 'hidden', marginTop: 4, minWidth: 240,
    }}>
      {/* Поиск по участникам клана */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
          letterSpacing: '.06em', marginBottom: 6 }}>
          👥 Участники клана
        </div>
        <input
          autoFocus
          style={{
            width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', padding: '5px 8px', fontSize: 13,
          }}
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Список участников клана */}
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>
            Участники не найдены
          </div>
        )}
        {filtered.map(m => {
          const nick = m.game_nick || m.nick;
          const selected = value?.nick === nick;
          return (
            <div
              key={m.id}
              onClick={() => selectMember(m)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                color: selected ? 'var(--accent)' : 'var(--text)',
                background: selected ? 'rgba(88,166,255,.08)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = selected
                ? 'rgba(88,166,255,.12)' : 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = selected
                ? 'rgba(88,166,255,.08)' : 'transparent'}
            >
              <span style={{ fontSize: 16 }}>🐻</span>
              <span>{nick}</span>
              {selected && <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Разделитель */}
      <div style={{
        padding: '8px 10px', borderTop: '1px solid var(--border)',
        background: 'rgba(0,0,0,.2)',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
          letterSpacing: '.06em', marginBottom: 6 }}>
          ✍️ Вписать ник вручную (не авторизован)
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            style={{
              flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', padding: '5px 8px', fontSize: 13,
            }}
            placeholder="Ник игрока..."
            value={customNick}
            onChange={e => setCustomNick(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && selectCustom()}
          />
          <button
            onClick={selectCustom}
            disabled={!customNick.trim()}
            style={{
              padding: '5px 12px', borderRadius: 6, border: 'none',
              background: customNick.trim() ? 'var(--accent)' : 'var(--bg3)',
              color: customNick.trim() ? '#0d1117' : 'var(--text3)',
              cursor: customNick.trim() ? 'pointer' : 'default',
              fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Кнопка добавления сердца ─────────────────────────────────────────
function AddHeartButton({ members, onAdd, loading }) {
  const [open, setOpen] = useState(false);
  const [finder, setFinder] = useState(null); // { user_id, nick }
  const wrapRef = useRef(null);

  function handleSelect(v) { setFinder(v); }

  async function handleAdd() {
    if (!finder) return;
    await onAdd({ found_by_user_id: finder.user_id, found_by_nick: finder.nick });
    setFinder(null);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Кнопка-пикер */}
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 8,
            background: open ? 'var(--bg3)' : 'var(--bg2)',
            border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
            color: finder ? 'var(--text)' : 'var(--text3)',
            cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
            minWidth: 160,
          }}
        >
          <span>❤️</span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            {finder ? finder.nick : 'Кто нашёл?'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <FinderDropdown
            members={members}
            value={finder}
            onChange={handleSelect}
            onClose={() => setOpen(false)}
          />
        )}
      </div>

      {/* Кнопка "Добавить" */}
      <button
        onClick={handleAdd}
        disabled={!finder || loading}
        style={{
          padding: '7px 18px', borderRadius: 8,
          background: finder && !loading ? 'var(--red)' : 'var(--bg3)',
          border: 'none',
          color: finder && !loading ? '#fff' : 'var(--text3)',
          cursor: finder && !loading ? 'pointer' : 'default',
          fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {loading ? '...' : '+ Добавить сердце'}
      </button>
    </div>
  );
}

// ─── Таблица статистики по участникам ─────────────────────────────────
function StatsTable({ stats }) {
  if (!stats.length) return null;

  const max = Math.max(...stats.map(s => parseInt(s.heart_count)));

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Заголовок */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 80px 160px',
        gap: 0, padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg3)',
      }}>
        {['#', 'Игрок', '❤️', 'Прогресс'].map((h, i) => (
          <div key={i} style={{
            fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
            letterSpacing: '.06em', fontWeight: 600,
          }}>{h}</div>
        ))}
      </div>

      {/* Строки */}
      {stats.map((s, idx) => {
        const pct = max > 0 ? (parseInt(s.heart_count) / max) * 100 : 0;
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
        return (
          <div key={`${s.nick}-${idx}`} style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 80px 160px',
            gap: 0, padding: '10px 14px',
            borderBottom: idx < stats.length - 1 ? '1px solid rgba(48,54,61,.5)' : 'none',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              {medal || <span style={{ color: 'var(--text3)' }}>{idx + 1}</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              {s.nick}
              {s.user_id === null && (
                <span style={{
                  marginLeft: 6, fontSize: 10, color: 'var(--text3)',
                  background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4,
                }}>гость</span>
              )}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700,
              color: idx === 0 ? '#e05252' : 'var(--text)',
            }}>
              {s.heart_count} <span style={{ fontSize: 14 }}>❤️</span>
            </div>
            <div style={{ padding: '0 8px 0 0' }}>
              <div style={{
                height: 6, borderRadius: 3, background: 'var(--bg3)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${pct}%`,
                  background: idx === 0
                    ? 'linear-gradient(90deg, #e05252, #ff7f7f)'
                    : 'linear-gradient(90deg, #4a6a8a, #6e8090)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Лог последних событий ────────────────────────────────────────────
function HeartsLog({ hearts, onDelete }) {
  if (!hearts.length) {
    return (
      <div style={{
        textAlign: 'center', padding: '30px', color: 'var(--text3)', fontSize: 13,
      }}>
        Пока нет записей. Добавь первое сердце! ❤️
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg3)', fontSize: 11, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600,
      }}>
        📋 История находок
      </div>
      {hearts.map((h, idx) => (
        <div key={h.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '9px 14px',
          borderBottom: idx < hearts.length - 1 ? '1px solid rgba(48,54,61,.5)' : 'none',
        }}>
          <span style={{ fontSize: 16 }}>❤️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{h.found_by_nick}</span>
            {!h.found_by_user_id && (
              <span style={{
                marginLeft: 5, fontSize: 10, color: 'var(--text3)',
                background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4,
              }}>гость</span>
            )}
            <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>
              нашёл сердце
            </span>
            {h.note && (
              <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 6 }}>
                · {h.note}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {new Date(h.recorded_at).toLocaleString('ru-RU', {
              day: '2-digit', month: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          {h.recorder_nick && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>от {h.recorder_nick}</span>
          )}
          <button
            onClick={() => onDelete(h.id)}
            title="Удалить"
            style={{
              background: 'none', border: 'none', color: 'var(--text3)',
              cursor: 'pointer', fontSize: 16, padding: '0 4px',
              opacity: 0.5, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Основная страница ────────────────────────────────────────────────
export default function HeartsPage({ clan, members, onHeartsUpdate }) {
  const [hearts, setHearts] = useState([]);
  const [stats,  setStats]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const loadHearts = useCallback(async () => {
    try {
      const data = await api.get('/hearts');
      setHearts(data.hearts || []);
      setStats(data.stats || []);
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHearts(); }, [loadHearts]);

  // Синхронизация через сокет (если onHeartsUpdate передаёт reload)
  useEffect(() => {
    if (onHeartsUpdate) onHeartsUpdate(loadHearts);
  }, [onHeartsUpdate, loadHearts]);

  async function handleAdd({ found_by_user_id, found_by_nick }) {
    setAdding(true);
    setError('');
    try {
      await api.post('/hearts', { found_by_user_id, found_by_nick });
      await loadHearts();
    } catch (e) {
      setError(e.message || 'Ошибка');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/hearts/${id}`);
      await loadHearts();
    } catch (e) {
      setError(e.message || 'Ошибка удаления');
    }
  }

  // Общее количество сердец
  const totalHearts = stats.reduce((sum, s) => sum + parseInt(s.heart_count), 0);

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">❤️ Учёт сердец</h2>
        <div className="empty-state"><p>Вступи в клан чтобы вести учёт сердец</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Заголовок */}
      <div className="bears-hdr">
        <h2 className="page-title">❤️ Учёт сердец — {clan.name}</h2>
        <div className="stat-pills">
          <span className="pill" style={{ color: '#e05252', borderColor: '#e05252', background: 'rgba(224,82,82,.1)' }}>
            ❤️ Всего: {totalHearts}
          </span>
          <span className="pill">
            👥 Участников: {stats.length}
          </span>
        </div>
      </div>

      {/* Блок добавления */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <AddHeartButton members={members} onAdd={handleAdd} loading={adding} />
        {error && (
          <div style={{ fontSize: 13, color: 'var(--red)', padding: '4px 8px' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Статистика */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Загрузка...</div>
      ) : (
        <>
          {stats.length > 0 && (
            <div>
              <div style={{
                fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
                letterSpacing: '.07em', marginBottom: 8, fontWeight: 600,
              }}>
                🏆 Таблица лидеров
              </div>
              <StatsTable stats={stats} />
            </div>
          )}

          {/* Лог */}
          <div>
            <div style={{
              fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
              letterSpacing: '.07em', marginBottom: 8, fontWeight: 600,
            }}>
              История
            </div>
            <HeartsLog hearts={hearts} onDelete={handleDelete} />
          </div>
        </>
      )}

      <div className="tbl-hint">
        ❤️ Нажми «Кто нашёл?» → выбери участника клана или впиши ник вручную · Статистика обновляется сразу
      </div>
    </div>
  );
}
