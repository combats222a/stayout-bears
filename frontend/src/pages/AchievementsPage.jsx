import { useState, useMemo } from 'react';
import { ACHIEVEMENTS } from '../content/achievementsData';
import AchievementIcon from '../components/AchievementIcon';

// Только 3 колонки кликабельны/сортируемы — Наименование, Описание, Опыт,
// как отмечено в референсе (красные стрелки на скриншоте). "Категория" и
// "Скрытое" убраны из таблицы совсем — категория теперь видна через иконку.
const COLUMNS = [
  { key: 'name', label: 'Наименование', getValue: r => r.name },
  { key: 'description', label: 'Описание', getValue: r => r.description },
  { key: 'exp', label: 'Опыт', getValue: r => r.exp },
];

function formatExp(n) {
  return n.toLocaleString('ru-RU');
}

export default function AchievementsPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  const handleSort = (key) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [search]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = COLUMNS.find(c => c.key === sort.key);
    if (!col) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      const va = col.getValue(a);
      const vb = col.getValue(b);
      let cmp;
      if (typeof va === 'string') cmp = va.localeCompare(vb, 'ru');
      else cmp = va - vb;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort]);

  return (
    <div className="page">
      <div className="bears-hdr">
        <h2 className="page-title">🏆 Достижения</h2>
        <div className="stat-pills">
          <span className="pill">📋 Показано: {sorted.length} из {ACHIEVEMENTS.length}</span>
        </div>
      </div>

      <input
        className="input captures-search"
        placeholder="Поиск по названию, описанию или категории..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginTop: 12 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="bears-table captures-table achievements-table">
            <thead>
              <tr>
                {COLUMNS.map(col => {
                  const isSorted = sort.key === col.key;
                  const arrow = isSorted ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅';
                  return (
                    <th
                      key={col.key}
                      className={`sortable-th${isSorted ? ' sortable-th-active' : ''}`}
                      onClick={() => handleSort(col.key)}
                      title="Нажмите, чтобы отсортировать"
                    >
                      {col.label} <span className="sort-arrow">{arrow}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AchievementIcon category={a.category} />
                      <span>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{a.description}</td>
                  <td>{formatExp(a.exp)}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="captures-legend" style={{ marginTop: 12 }}>
        <span>🖼️ Иконки — свои, по категориям достижения (не с чужого сайта)</span>
        <span>📄 Список пока неполный ({ACHIEVEMENTS.length} из 304) — добавляется по частям</span>
      </div>
    </div>
  );
}
