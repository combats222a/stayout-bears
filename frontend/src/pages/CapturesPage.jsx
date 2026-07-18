import { useState, useEffect, useMemo } from 'react';
import InfoSpoiler from '../components/InfoSpoiler';
import StarIcon from '../components/StarIcon';
import SoundIcon from '../components/SoundIcon';
import { CAPTURES_SPOILER } from '../content/spoilerContent';
import { CAPTURE_LOCATIONS } from '../content/captureLocations';
import { getCaptureStatus, formatDuration, getViewerTimezoneLabel } from '../utils/captures';
import {
  isCaptureSoundEnabled, setCaptureSoundEnabled,
  isCaptureFavorite, setCaptureFavorite,
} from '../utils/soundPrefs';

// Значение для сортировки колонки "До начала / до конца захвата":
// активные точки всегда идут первыми (по возрастанию времени до конца),
// затем остальные — по возрастанию времени до начала.
function countdownSortValue(status) {
  return status.isActive ? status.msToEnd - 1e13 : status.msToStart;
}

const COLUMNS = [
  { key: 'name', label: 'Наименование', getValue: r => r.loc.name },
  { key: 'type', label: 'Тип', getValue: r => r.loc.type },
  { key: 'location', label: 'Локация', getValue: r => r.loc.location },
  { key: 'coords', label: 'Координаты', getValue: r => r.loc.coords },
  { key: 'date', label: 'Дата захвата', getValue: r => r.status.start.getTime() },
  { key: 'countdown', label: 'До начала / до конца захвата', getValue: r => countdownSortValue(r.status) },
];

export default function CapturesPage() {
  const [now, setNow] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  // Избранное и звук — по умолчанию выключены у всех точек, состояние
  // читается из localStorage при загрузке и запоминается для игрока.
  const [favorites, setFavorites] = useState(() => {
    const map = {};
    for (const loc of CAPTURE_LOCATIONS) map[loc.name] = isCaptureFavorite(loc.name);
    return map;
  });
  const [soundOn, setSoundOn] = useState(() => {
    const map = {};
    for (const loc of CAPTURE_LOCATIONS) map[loc.name] = isCaptureSoundEnabled(loc.name);
    return map;
  });

  const toggleFavorite = (name) => {
    setFavorites(prev => {
      const next = !prev[name];
      setCaptureFavorite(name, next);
      return { ...prev, [name]: next };
    });
  };

  const toggleSound = (name) => {
    setSoundOn(prev => {
      const next = !prev[name];
      setCaptureSoundEnabled(name, next);
      return { ...prev, [name]: next };
    });
  };

  const handleSort = (key) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  // Тикаем раз в секунду — таймеры "до начала"/"до конца" в таблице живые
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    return CAPTURE_LOCATIONS
      .map(loc => ({ loc, status: getCaptureStatus(loc, now) }))
      .sort((a, b) => {
        // Активные — первыми, дальше по возрастанию времени до начала
        if (a.status.isActive !== b.status.isActive) return a.status.isActive ? -1 : 1;
        return a.status.msToStart - b.status.msToStart;
      });
  }, [now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ loc }) =>
      loc.name.toLowerCase().includes(q) ||
      loc.location.toLowerCase().includes(q) ||
      loc.coords.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    const col = sort.key ? COLUMNS.find(c => c.key === sort.key) : null;
    const list = [...filtered];
    list.sort((a, b) => {
      // Избранные точки всегда всплывают наверх — как закреплённые
      // закладки в браузере — независимо от того, какая колонка выбрана.
      const af = favorites[a.loc.name] ? 1 : 0;
      const bf = favorites[b.loc.name] ? 1 : 0;
      if (af !== bf) return bf - af;

      if (!col) return 0;
      const va = col.getValue(a);
      const vb = col.getValue(b);
      let cmp;
      if (typeof va === 'string') cmp = va.localeCompare(vb, 'ru');
      else cmp = va - vb;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort, favorites]);

  const activeCount = rows.filter(r => r.status.isActive).length;
  const soonCount = rows.filter(r => r.status.isSoon).length;

  return (
    <div className="page">
      <div className="bears-hdr">
        <h2 className="page-title">🚩 Захваты</h2>
        <div className="stat-pills">
          <span className="pill" style={{ color: 'var(--red)', borderColor: 'rgba(248,81,73,.4)', background: 'rgba(248,81,73,.1)' }}>
            🔴 Идёт сейчас: {activeCount}
          </span>
          <span className="pill" style={{ color: 'var(--orange)', borderColor: 'rgba(210,153,34,.4)', background: 'rgba(210,153,34,.1)' }}>
            🟡 Скоро: {soonCount}
          </span>
          <span className="pill">📍 Всего точек: {CAPTURE_LOCATIONS.length}</span>
        </div>
      </div>

      <div className="captures-tz-note">
        🕒 Время до захвата рассчитано в соответствии с часовым поясом, установленным на вашем устройстве: <b>{getViewerTimezoneLabel(now)}</b>
      </div>

      <InfoSpoiler {...CAPTURES_SPOILER} storageKey="spoiler_captures" />

      <input
        className="input captures-search"
        placeholder="Поиск по названию, локации или координатам..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="bears-table captures-table">
            <thead>
              <tr>
                <th className="captures-col-icon" title="Избранное">
                  <StarIcon size={14} on={false} />
                </th>
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
                <th className="captures-col-icon" title="Звуковое уведомление">
                  <SoundIcon size={14} on={false} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ loc, status }) => {
                const isFav = !!favorites[loc.name];
                const isSoundOn = !!soundOn[loc.name];
                const rowClass = [
                  status.isActive ? 'capture-row-active' : status.isSoon ? 'capture-row-soon' : '',
                  isFav ? 'capture-row-favorite' : '',
                ].filter(Boolean).join(' ');
                return (
                  <tr key={loc.name} className={rowClass}>
                    <td className="captures-col-icon">
                      <button
                        className={`star-btn ${isFav ? 'star-on' : ''}`}
                        onClick={() => toggleFavorite(loc.name)}
                        title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                      >
                        <StarIcon on={isFav} />
                      </button>
                    </td>
                    <td>{loc.name}</td>
                    <td>{loc.type}</td>
                    <td>{loc.location}</td>
                    <td><span className="square-badge">{loc.coords}</span></td>
                    <td>
                      {status.start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })},{' '}
                      {status.start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      {status.isActive ? (
                        <span className="capture-time capture-time-active">
                          {formatDuration(status.msToEnd)}
                        </span>
                      ) : (
                        <span className={`capture-time ${status.isSoon ? 'capture-time-soon' : ''}`}>
                          {formatDuration(status.msToStart)}
                        </span>
                      )}
                    </td>
                    <td className="captures-col-icon">
                      <button
                        className={`rupor-btn rupor-btn-sm ${isSoundOn ? 'rupor-on' : 'rupor-off'}`}
                        onClick={() => toggleSound(loc.name)}
                        title={isSoundOn ? 'Звук в начале захвата включён' : 'Звук в начале захвата выключен'}
                      >
                        <SoundIcon on={isSoundOn} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="captures-legend">
        <span><span className="legend-swatch legend-swatch-active" /> — точка захватывается прямо сейчас</span>
        <span><span className="legend-swatch legend-swatch-soon" /> — захват начнётся в течение ближайшего часа</span>
        <span style={{ color: '#e3b341' }}><StarIcon size={13} on /> — избранные точки поднимаются наверх таблицы</span>
        <span style={{ color: 'var(--green)' }}><SoundIcon size={13} on /> — звук в момент начала захвата (по умолчанию выключен, включается за точку)</span>
      </div>
    </div>
  );
}
