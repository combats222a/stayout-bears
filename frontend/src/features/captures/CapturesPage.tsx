import { useState, useEffect, useMemo, ReactNode } from 'react';
import InfoSpoiler from '../../components/InfoSpoiler';
import StarIcon from '../../components/StarIcon';
import SoundIcon from '../../components/SoundIcon';
import { CAPTURES_SPOILER } from '../../content/spoilerContent';
import { CAPTURE_LOCATIONS, CAPTURE_TYPE_LABEL } from '../../content/captureLocations';
import type { CaptureLocation } from '../../content/captureLocations';
import { getCaptureStatus, formatDuration, getViewerTimezoneLabel } from '../../utils/captures';
import type { CaptureStatus } from '../../utils/captures';
import {
  isCaptureSoundEnabled, setCaptureSoundEnabled,
  isCaptureFavorite, setCaptureFavorite,
} from '../../utils/soundPrefs';
import { useI18n, useLocaleDict } from '../../i18n';
import ruCaptures from '../../i18n/locales/ru/captures';
import enCaptures from '../../i18n/locales/en/captures';

interface Row {
  loc: CaptureLocation;
  status: CaptureStatus;
}

// Значение для сортировки колонки "До начала / до конца захвата":
// активные точки всегда идут первыми (по возрастанию времени до конца),
// затем остальные — по возрастанию времени до начала.
function countdownSortValue(status: CaptureStatus): number {
  return status.isActive ? status.msToEnd - 1e13 : status.msToStart;
}

interface Column {
  key: 'name' | 'type' | 'location' | 'coords' | 'date' | 'countdown';
  label: string;
  getValue: (r: Row) => string | number;
}

export default function CapturesPage() {
  const { locale } = useI18n();
  const c = useLocaleDict(ruCaptures, enCaptures);
  const [now, setNow] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' });

  const COLUMNS: Column[] = useMemo(() => [
    { key: 'name', label: c.colName, getValue: r => r.loc.name[locale] },
    { key: 'type', label: c.colType, getValue: r => r.loc.type },
    { key: 'location', label: c.colLocation, getValue: r => r.loc.location[locale] },
    { key: 'coords', label: c.colCoords, getValue: r => r.loc.coords },
    { key: 'date', label: c.colDate, getValue: r => r.status.start.getTime() },
    { key: 'countdown', label: c.colCountdown, getValue: r => countdownSortValue(r.status) },
  ], [c, locale]);

  // Избранное и звук — по умолчанию выключены у всех точек, состояние
  // читается из localStorage при загрузке и запоминается для игрока.
  // Ключ хранения — coords (устойчивый ID точки, не зависит от языка),
  // а не name, т.к. name теперь локализован и не подходит на роль ключа.
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const loc of CAPTURE_LOCATIONS) map[loc.coords] = isCaptureFavorite(loc.coords);
    return map;
  });
  const [soundOn, setSoundOn] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const loc of CAPTURE_LOCATIONS) map[loc.coords] = isCaptureSoundEnabled(loc.coords);
    return map;
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = !prev[id];
      setCaptureFavorite(id, next);
      return { ...prev, [id]: next };
    });
  };

  const toggleSound = (id: string) => {
    setSoundOn(prev => {
      const next = !prev[id];
      setCaptureSoundEnabled(id, next);
      return { ...prev, [id]: next };
    });
  };

  const handleSort = (key: Column['key']) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  // «Захваты»-спойлер: подменяем текстовые кружки 🔵🟡🔴 у пункта про цвет
  // звезды на реальные цветные иконки-звёздочки — такие же, как в подписи
  // под таблицей — чтобы это выглядело наглядно, а не текстом.
  const capturesSpoiler = useMemo(() => {
    const base = CAPTURES_SPOILER[locale];
    const blocks = base.blocks.map(block => {
      if (block.heading !== c.spoilerFavHeadingMatch) return block;
      const body: ReactNode[] = [
        c.spoilerFavBullet1,
        c.spoilerFavBullet2,
        c.spoilerFavColorLabel,
        <span key="star-blue">
          <span style={{ color: 'var(--accent)' }}><StarIcon size={13} on /></span>
          {' '}{c.spoilerFavBlue}
        </span>,
        <span key="star-yellow">
          <span style={{ color: 'var(--orange)' }}><StarIcon size={13} on /></span>
          {' '}{c.spoilerFavYellow}
        </span>,
        <span key="star-red">
          <span style={{ color: 'var(--red)' }}><StarIcon size={13} on /></span>
          {' '}{c.spoilerFavRed}
        </span>,
      ];
      return { ...block, body };
    });
    return { ...base, blocks };
  }, [locale, c]);

  // Тикаем раз в секунду — таймеры "до начала"/"до конца" в таблице живые
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo<Row[]>(() => {
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
      loc.name[locale].toLowerCase().includes(q) ||
      loc.name.ru.toLowerCase().includes(q) ||
      loc.name.en.toLowerCase().includes(q) ||
      loc.location[locale].toLowerCase().includes(q) ||
      loc.coords.toLowerCase().includes(q) ||
      CAPTURE_TYPE_LABEL[loc.type][locale].toLowerCase().includes(q)
    );
  }, [rows, search, locale]);

  const sorted = useMemo(() => {
    const col = sort.key ? COLUMNS.find(cc => cc.key === sort.key) : null;
    const list = [...filtered];
    list.sort((a, b) => {
      // Избранные точки всегда всплывают наверх — как закреплённые
      // закладки в браузере — независимо от того, какая колонка выбрана.
      const af = favorites[a.loc.coords] ? 1 : 0;
      const bf = favorites[b.loc.coords] ? 1 : 0;
      if (af !== bf) return bf - af;

      if (!col) return 0;
      const va = col.getValue(a);
      const vb = col.getValue(b);
      let cmp: number;
      if (typeof va === 'string') cmp = va.localeCompare(vb as string, locale === 'en' ? 'en' : 'ru');
      else cmp = va - (vb as number);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort, favorites, COLUMNS]);

  const activeCount = rows.filter(r => r.status.isActive).length;
  const soonCount = rows.filter(r => r.status.isSoon).length;

  return (
    <div className="page">
      <div className="bears-hdr">
        <h2 className="page-title">{c.title}</h2>
        <div className="stat-pills">
          <span className="pill" style={{ color: 'var(--red)', borderColor: 'rgba(248,81,73,.4)', background: 'rgba(248,81,73,.1)' }}>
            {c.activeNow(activeCount)}
          </span>
          <span className="pill" style={{ color: 'var(--orange)', borderColor: 'rgba(210,153,34,.4)', background: 'rgba(210,153,34,.1)' }}>
            {c.soon(soonCount)}
          </span>
          <span className="pill">{c.totalPoints(CAPTURE_LOCATIONS.length)}</span>
        </div>
      </div>

      <div className="captures-tz-note">
        {c.tzNotePrefix} <b>{getViewerTimezoneLabel(now, locale)}</b>
      </div>

      <InfoSpoiler {...capturesSpoiler} storageKey="spoiler_captures" />

      <input
        className="input captures-search"
        placeholder={c.searchPlaceholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="bears-table captures-table">
            <thead>
              <tr>
                <th className="captures-col-icon" title={c.favoriteTitle}>
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
                      title={c.sortHint}
                    >
                      {col.label} <span className="sort-arrow">{arrow}</span>
                    </th>
                  );
                })}
                <th className="captures-col-icon" title={c.soundTitle}>
                  <SoundIcon size={14} on={false} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ loc, status }) => {
                const isFav = !!favorites[loc.coords];
                const isSoundOn = !!soundOn[loc.coords];
                const starStatusClass = !isFav
                  ? ''
                  : status.isActive
                    ? 'star-on star-fav-active'
                    : status.isSoon
                      ? 'star-on star-fav-soon'
                      : 'star-on';
                const rowClass = status.isActive
                  ? 'capture-row-active'
                  : status.isSoon
                    ? 'capture-row-soon'
                    : isFav
                      ? 'capture-row-favorite'
                      : '';
                return (
                  <tr key={loc.coords} className={rowClass}>
                    <td className="captures-col-icon">
                      <button
                        className={`star-btn ${starStatusClass}`}
                        onClick={() => toggleFavorite(loc.coords)}
                        title={isFav ? c.removeFavorite : c.addFavorite}
                      >
                        <StarIcon on={isFav} />
                      </button>
                    </td>
                    <td>{loc.name[locale]}</td>
                    <td>{CAPTURE_TYPE_LABEL[loc.type][locale]}</td>
                    <td>{loc.location[locale]}</td>
                    <td><span className="square-badge">{loc.coords}</span></td>
                    <td>
                      {status.start.toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })},{' '}
                      {status.start.toLocaleTimeString(locale === 'en' ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}
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
                        onClick={() => toggleSound(loc.coords)}
                        title={isSoundOn ? c.soundOnTitle : c.soundOffTitle}
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
                    {c.notFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="captures-legend">
        <span><span className="legend-swatch legend-swatch-active" /> {c.legendActive}</span>
        <span><span className="legend-swatch legend-swatch-soon" /> {c.legendSoon}</span>
        <span style={{ color: 'var(--accent)' }}><StarIcon size={13} on /> {c.legendFavorite}</span>
        <span style={{ color: 'var(--green)' }}><SoundIcon size={13} on /> {c.legendSound}</span>
        <span>
          {c.legendStarColorPrefix}{' '}
          <span style={{ color: 'var(--accent)' }}><StarIcon size={13} on /></span> {c.legendStarFavorite}{' '}
          <span style={{ color: 'var(--orange)' }}><StarIcon size={13} on /></span> {c.legendStarSoon}{' '}
          <span style={{ color: 'var(--red)' }}><StarIcon size={13} on /></span> {c.legendStarActive}
        </span>
      </div>
    </div>
  );
}

interface SortState {
  key: Column['key'] | null;
  dir: 'asc' | 'desc';
}
