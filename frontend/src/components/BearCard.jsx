import { useState, useEffect, useRef } from 'react';
import { getBearStatus, getTimeLeft, formatTime, getProgress } from '../utils/bears';
import { playSpawnSound } from '../utils/sound';

export default function BearCard({ bear, onKill, onReset, disabled }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(bear));
  const [status, setStatus] = useState(() => getBearStatus(bear));
  const prevStatus = useRef(status);

  useEffect(() => {
    setTimeLeft(getTimeLeft(bear));
    setStatus(getBearStatus(bear));
  }, [bear]);

  useEffect(() => {
    if (status === 'dead') {
      const id = setInterval(() => {
        const tl = getTimeLeft(bear);
        setTimeLeft(tl);
        if (tl <= 0) {
          setStatus('alive');
          if (prevStatus.current === 'dead') {
            playSpawnSound();
          }
        }
      }, 1000);
      return () => clearInterval(id);
    }
    prevStatus.current = status;
  }, [status, bear]);

  const progress = getProgress(bear);
  const alive = status === 'alive';

  return (
    <div className={`bear-card ${alive ? 'alive' : 'dead'}`}>
      <div className="bear-index">#{bear.bear_index}</div>

      <div className="bear-icon">{alive ? '🐻‍❄️' : '💀'}</div>

      <div className="bear-status">
        {alive ? (
          <span className="status-alive">Жив</span>
        ) : (
          <>
            <span className="status-dead">Мёртв</span>
            {bear.killer_nick && (
              <span className="killer">убит: {bear.killer_nick}</span>
            )}
          </>
        )}
      </div>

      {!alive && (
        <div className="timer-block">
          <div className="timer-label">Спавн через</div>
          <div className="timer-value">{formatTime(timeLeft)}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      <div className="bear-actions">
        {alive ? (
          <button className="btn btn-kill" onClick={() => onKill(bear.bear_index)} disabled={disabled}>
            ☠️ Убит
          </button>
        ) : (
          <button className="btn btn-reset" onClick={() => onReset(bear.bear_index)} disabled={disabled}>
            ↺ Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
