import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  BEARS_LIST, getBearMeta, getBearStatus,
  getTimeLeftMs, formatCountdown, formatClock, formatElapsed, getProgress,
  parseLocalTimeInput, killedAtFromSpawnAt
} from '../utils/bears';
import { isBearSoundEnabled, setBearSoundEnabled } from '../utils/soundPrefs';
import SoundIcon from '../components/SoundIcon';
import MaskedTimeInput, { digitsToTimeStr } from '../components/MaskedTimeInput';
import InfoSpoiler from '../components/InfoSpoiler';
import GuestLock from '../components/GuestLock';
import { BEARS_SPOILER } from '../content/spoilerContent';

// ── Modal for entering kill time ─────────────────────────────────────────────
function KillTimeModal({ bearName, onCommit, onClose }) {
  const [digits, setDigits] = useState(() => {
    // Pre-fill with current local time (только цифры)
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}${mm}${ss}`;
  });
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!digits) { setError('Введи время — просто цифры, например 093500'); return; }
    const timeStr = digitsToTimeStr(digits, 3);
    const iso = parseLocalTimeInput(timeStr);
    if (!iso) { setError('Неверное время'); return; }
    onCommit(iso);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⏱ Время смерти — <span className="modal-bear-name">{bearName}</span></div>
        <div className="modal-body">
          <label className="modal-label">Введи время когда убили медведя (только цифры)</label>
          <MaskedTimeInput
            segments={3}
            value={digits}
            onChange={d => { setDigits(d); setError(''); }}
            onEnter={handleSubmit}
            placeholder="09:35:00"
            autoFocus
          />
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-hint">Backspace удаляет время справа налево: секунды → минуты → часы. Затем просто вводи цифры — двоеточия расставятся сами · Время твоего часового пояса</div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="modal-btn-ok btn-shiny" onClick={handleSubmit}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── Bear row ────────────────────────────────────────────────────────────────
function BearRow({ bear, onKill, onVanish, onReset, onManualTime }) {
  const [showModal, setShowModal] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isBearSoundEnabled(bear.bear_index));

  // Раньше у каждой строки был свой setInterval со случайным сдвигом старта —
  // специально чтобы тики разных строк НЕ совпадали в один кадр (расчёт был
  // на снижение нагрузки на кадр). На практике на слабом/багованном GPU
  // (Redmi 8 Pro) это давало обратный эффект: ~10+ независимых асинхронных
  // частичных перерисовок в секунду, размазанных по экрану — страница
  // никогда не находится в стабильном состоянии, отсюда рваный рендер.
  // Ручной клик по кнопке форсирует ОДИН общий re-render всего списка —
  // и именно поэтому картинка на секунду чинится. Теперь тик общий для всей
  // страницы (см. forceTick в BearsPage) — все строки обновляются одним
  // атомарным рендером раз в секунду, как при прокликивании всех кнопок
  // разом, только автоматически.
  const ms   = getTimeLeftMs(bear);
  const elap = formatElapsed(bear.killed_at);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setBearSoundEnabled(bear.bear_index, next);
  }

  const isDead    = getBearStatus(bear) === 'dead';
  const isReady   = bear.spawn_at && !isDead;
  const isWarning = isDead && ms <= 5 * 60_000;
  const meta      = getBearMeta(bear.bear_index);
  const pct       = getProgress(bear);
  const isActive  = isDead || isReady;

  let rowCls = 'bear-row';
  if (isReady)        rowCls += ' row-ready';
  else if (isWarning) rowCls += ' row-warn';
  else if (isDead)    rowCls += ' row-active';

  let dotCls = 'sdot';
  if (isReady)        dotCls += ' sdot-green';
  else if (isWarning) dotCls += ' sdot-orange';
  else if (isDead)    dotCls += ' sdot-blue';

  let timerColor = '';
  if (isReady)        timerColor = '#50c878';
  else if (isWarning) timerColor = '#e0a030';
  else if (isDead)    timerColor = '#c8d6e5';

  let barColor = '#1e3a5f';
  if (isReady)        barColor = '#50c878';
  else if (isWarning) barColor = '#e0a030';
  else if (isDead)    barColor = '#4a9edd';

  const spawnDisplay  = formatClock(bear.spawn_at);
  const killedDisplay = formatClock(bear.killed_at);

  // Единая разметка для десктопа и мобилки — таблица всегда рендерится
  // одна и та же, адаптацию под маленький экран делает чистый CSS (медиа-
  // запрос с CSS Grid, см. .bears-table в styles.css). Раньше здесь было
  // JS-ветвление на два совершенно разных поддерева (card vs tr) плюс ручной
  // repaint-хак в BearsPage/DraugsPage — именно связка «разное дерево при
  // ресайзе/смене ориентации + async вставка данных» давала на части
  // Android-телефонов визуальный «слом» экрана (наложение/битые кадры).
  // Один и тот же DOM во всех размерах экрана убирает саму возможность
  // такого бага: браузеру нечего пересобирать, меняется только CSS.
  return (
    <>
      <tr className={rowCls}>
        <td className="td-dot"><span className={dotCls} /></td>
        <td className="td-name" data-label="Медведь">{meta.name}</td>
        <td className="td-square" data-label="Квадрат"><span className="square-badge">{meta.square}</span></td>
        <td className="td-timer" data-label="До спавна">
          {isReady
            ? <span className="spawn-tag">⚡ Спавн!</span>
            : <div className="prog-wrap">
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${pct * 100}%`, background: barColor }} />
                </div>
                <span className="timer-val" style={{ color: timerColor }}>
                  {isDead ? formatCountdown(ms) : '--:--'}
                </span>
              </div>
          }
        </td>
        <td className="td-actions" data-label="Действия">
          <div className="act-btns">
            {!isDead && !isReady
              ? <>
                  <button className="btn-now"  onClick={() => onKill(bear.bear_index)}>Сейчас</button>
                  <button className="btn-gone" onClick={() => onVanish(bear.bear_index)}>Исчез</button>
                </>
              : <button className="btn-reset-row" onClick={() => onReset(bear.bear_index)}>✕ Сброс</button>
            }
            <button
              className={`rupor-btn rupor-btn-sm ${soundOn ? 'rupor-on' : 'rupor-off'}`}
              onClick={toggleSound}
              title={soundOn ? 'Звук по спавну включён' : 'Звук по спавну выключен'}
            >
              <SoundIcon on={soundOn} />
            </button>
          </div>
        </td>
        <td className={`td-clock${isActive ? '' : ' td-clock-empty'}`} data-label="Спавн">{isActive ? spawnDisplay : '--:--:--'}</td>
        <td className={`td-clock${isActive ? '' : ' td-clock-empty'}`} data-label="Прошло">{isActive ? elap : '--:--:--'}</td>
        <td data-label="Смерть">
          {isActive
            ? <span className="td-clock clock-editable" title="Нажми чтобы исправить время смерти" onClick={() => setShowModal(true)}>
                {killedDisplay}<span className="edit-icon"> ✎</span>
              </span>
            : <span className="td-clock clock-editable clock-empty" title="Нажми чтобы ввести время смерти" onClick={() => setShowModal(true)}>
                --:--:--<span className="edit-icon"> ✎</span>
              </span>
          }
        </td>
        <td className="td-user" data-label="Игрок">{bear.killer_nick || '—'}</td>
      </tr>

      {showModal && (
        <KillTimeModal
          bearName={meta.name}
          onCommit={iso => onManualTime(bear.bear_index, iso)}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function BearsPage({ bears, clan, onBearChange, isGuest, onLoginClick }) {
  const [error, setError] = useState('');
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Один общий тик на всю страницу вместо ~11 независимых setInterval со
  // случайным сдвигом на каждую строку (см. комментарий в BearRow). Любое
  // изменение этого состояния триггерит re-render BearsPage, а значит и
  // ВСЕХ BearRow разом (они не обёрнуты в memo) — то есть один атомарный
  // рендер всего списка раз в секунду, а не размазанный поток частичных
  // обновлений.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mergedBears = BEARS_LIST.map(meta => {
    const found = bears.find(b => b.bear_index === meta.index);
    return found || { bear_index: meta.index, spawn_at: null, killed_at: null, killer_nick: null };
  });

  const active = mergedBears.filter(b => getBearStatus(b) === 'dead').length;
  const ready  = mergedBears.filter(b => b.spawn_at && getBearStatus(b) === 'alive').length;

  async function killBear(index, killedAt) {
    setError('');
    try {
      const body = killedAt ? { killed_at: killedAt } : {};
      const { bear } = await api.post(`/bears/${index}/kill`, body);
      onBearChange({ ...bear });
    } catch (e) { setError(e.message); }
  }

  async function vanishBear(index) {
    const killedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await killBear(index, killedAt);
  }

  async function resetBear(index) {
    setError('');
    try {
      const { bear } = await api.post(`/bears/${index}/reset`);
      onBearChange({ ...bear });
    } catch (e) { setError(e.message); }
  }

  async function handleManualTime(index, killedAtIso) {
    await killBear(index, killedAtIso);
  }

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">Медведи</h2>
        <InfoSpoiler {...BEARS_SPOILER} storageKey="spoiler_bears" />
        {isGuest ? (
          <GuestLock
            icon="🐻‍❄️"
            title="Отслеживай спавны медведей вместе с кланом"
            text="Тайминги медведей и синхронизация с кланом доступны после регистрации — это займёт меньше минуты."
            onLoginClick={onLoginClick}
          />
        ) : (
          <div className="empty-state"><p>Вступи в клан чтобы отслеживать медведей</p></div>
        )}
      </div>
    );
  }

  return (
    <div className="page bears-page">
      <div className="bears-hdr">
        <h2 className="page-title">🐻‍❄️ Белые медведи — {clan.name}</h2>
        <div className="stat-pills">
          {active > 0 && <span className="pill pill-blue">⏱ {active} таймер{active > 1 ? 'а' : ''}</span>}
          {ready  > 0 && <span className="pill pill-green">⚡ {ready} спавн!</span>}
        </div>
      </div>
      <InfoSpoiler {...BEARS_SPOILER} storageKey="spoiler_bears" />
      {error && <div className="error-msg">{error}</div>}

      <div className="tbl-wrap">
        <table className="bears-table">
          <thead>
            <tr>
              <th></th>
              <th>Название</th>
              <th>Квадрат</th>
              <th>До спавна</th>
              <th>Действия</th>
              <th>Время спавна</th>
              <th>Прошло времени</th>
              <th>Время смерти</th>
              <th>Игрок</th>
            </tr>
          </thead>
          <tbody>
            {mergedBears.map(bear => (
              <BearRow
                key={bear.bear_index}
                bear={bear}
                onKill={killBear}
                onVanish={vanishBear}
                onReset={resetBear}
                onManualTime={handleManualTime}
              />
            ))}
          </tbody>
        </table>
        <div className="tbl-timezone">
          ⏱ Часовой пояс: <span className="tbl-timezone-value">{userTimezone}</span>
        </div>
      </div>
      <div className="tbl-hint">
        ⚡ Звук за 5 мин до спавна · «Исчез» — медведь пропал ~5 мин назад · ✎ Нажми на «Время смерти» чтобы исправить
      </div>
    </div>
  );
}
