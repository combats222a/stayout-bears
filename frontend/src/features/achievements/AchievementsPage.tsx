import { useState, useMemo } from 'react';
import { ACHIEVEMENTS } from '../../content/achievementsData';
import type { Achievement } from '../../content/achievementsData';
import AchievementIcon from '../../components/AchievementIcon';
import InfoSpoiler from '../../components/InfoSpoiler';
import { ACHIEVEMENTS_SPOILER } from '../../content/spoilerContent';
import { useI18n, useLocaleDict } from '../../i18n';
import ruAchievements from '../../i18n/locales/ru/achievements';
import enAchievements from '../../i18n/locales/en/achievements';

interface Column {
  key: 'name' | 'description' | 'exp';
  label: string;
  getValue: (r: Achievement) => string | number;
}

function formatExp(n: number, locale: string): string {
  return n.toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU');
}

interface SortState {
  key: Column['key'] | null;
  dir: 'asc' | 'desc';
}

export default function AchievementsPage() {
  const { locale } = useI18n();
  const c = useLocaleDict(ruAchievements, enAchievements);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' });

  // Только 3 колонки кликабельны/сортируемы — Наименование, Описание, Опыт,
  // как отмечено в референсе (красные стрелки на скриншоте). "Категория" и
  // "Скрытое" убраны из таблицы совсем — категория теперь видна через иконку.
  const columns: Column[] = useMemo(() => [
    { key: 'name', label: c.colName, getValue: r => r.name[locale] },
    { key: 'description', label: c.colDescription, getValue: r => r.description[locale] },
    { key: 'exp', label: c.colExp, getValue: r => r.exp },
  ], [c, locale]);

  const handleSort = (key: Column['key']) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ACHIEVEMENTS;
    // Ищем и по текущему языку, и по русскому/английскому исходнику разом —
    // так поиск не ломается, если человек начал печатать раньше, чем
    // переключил язык, или помнит название достижения на другом языке.
    return ACHIEVEMENTS.filter(a =>
      a.name.ru.toLowerCase().includes(q) ||
      a.name.en.toLowerCase().includes(q) ||
      a.description.ru.toLowerCase().includes(q) ||
      a.description.en.toLowerCase().includes(q) ||
      a.category.ru.toLowerCase().includes(q) ||
      a.category.en.toLowerCase().includes(q)
    );
  }, [search]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = columns.find(cc => cc.key === sort.key);
    if (!col) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      const va = col.getValue(a);
      const vb = col.getValue(b);
      let cmp: number;
      if (typeof va === 'string') cmp = va.localeCompare(vb as string, locale === 'en' ? 'en' : 'ru');
      else cmp = va - (vb as number);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort, columns, locale]);

  return (
    <div className="page">
      <div className="bears-hdr">
        <h2 className="page-title">{c.title}</h2>
        <div className="stat-pills">
          <span className="pill">{c.shown(sorted.length, ACHIEVEMENTS.length)}</span>
        </div>
      </div>

      <InfoSpoiler {...ACHIEVEMENTS_SPOILER[locale]} storageKey="spoiler_achievements" />

      <input
        className="input captures-search"
        placeholder={c.searchPlaceholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginTop: 12 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="bears-table captures-table achievements-table">
            <thead>
              <tr>
                {columns.map(col => {
                  const isSorted = sort.key === col.key;
                  const arrow = isSorted ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅';
                  return (
                    <th
                      key={col.key}
                      className={`sortable-th${isSorted ? ' sortable-th-active' : ''}`}
                      onClick={() => handleSort(col.key)}
                      title={c.sortHint}
                    >
                      {col.label} <span className="sort-arrow">{arrow}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.name.ru}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AchievementIcon category={a.category.ru} />
                      <span>{a.name[locale]}</span>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{a.description[locale]}</td>
                  <td>{formatExp(a.exp, locale)}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>
                    {c.notFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
