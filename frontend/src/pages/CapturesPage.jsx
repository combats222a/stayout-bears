import { useState, useEffect, useMemo } from 'react';
import InfoSpoiler from '../components/InfoSpoiler';
import { CAPTURES_SPOILER } from '../content/spoilerContent';
import { CAPTURE_LOCATIONS } from '../content/captureLocations';
import { getCaptureStatus, formatDuration, getViewerTimezoneLabel } from '../utils/captures';

export default function CapturesPage() {
  const [now, setNow] = useState(() => new Date());
  const [search, setSearch] = useState('');

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

  const activeCount = rows.filter(r => r.status.isActive).length;
  const soonCount = rows.filter(r => r.status.isSoon).length;

  return (
    <div className="page">
      <div className="bears-hdr">
        <h2 className="page-title">🚩 Захваты</h2>
        <div className="stat-pills">
          <span className="pill" style={{ color: 'var(--green)', borderColor: 'rgba(63,185,80,.4)', background: 'rgba(63,185,80,.1)' }}>
            🟢 Идёт сейчас: {activeCount}
          </span>
          <span className="pill" style={{ color: 'var(--red)', borderColor: 'rgba(248,81,73,.4)', background: 'rgba(248,81,73,.1)' }}>
            🔴 Скоро: {soonCount}
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
                <th>Наименование</th>
                <th>Тип</th>
                <th>Локация</th>
                <th>Координаты</th>
                <th>Дата захвата</th>
                <th>До начала захвата</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ loc, status }) => {
                const rowClass = status.isActive
                  ? 'capture-row-active'
                  : status.isSoon
                    ? 'capture-row-soon'
                    : '';
                return (
                  <tr key={loc.name} className={rowClass}>
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
                          Идёт захват — до конца {formatDuration(status.msToEnd)}
                        </span>
                      ) : (
                        <span className={`capture-time ${status.isSoon ? 'capture-time-soon' : ''}`}>
                          {formatDuration(status.msToStart)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>
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
      </div>
    </div>
  );
}
