import { useState } from 'react';
import SoundIcon from '../../../components/SoundIcon';
import KillTimeModal from './KillTimeModal';
import type { TrackerConfig } from '../trackerConfig';
import type { TrackerItem } from '../createTrackerStore';

interface TrackerRowProps {
  item: TrackerItem;
  config: TrackerConfig;
  onKill: (index: number) => void;
  onVanish: (index: number) => void;
  onReset: (index: number) => void;
  onManualTime: (index: number, killedAtIso: string) => void;
}

// Раньше у каждой строки был свой setInterval со случайным сдвигом старта —
// специально чтобы тики разных строк НЕ совпадали в один кадр (расчёт был
// на снижение нагрузки на кадр). На практике на слабом/багованном GPU
// (Redmi 8 Pro) это давало обратный эффект: ~10+ независимых асинхронных
// частичных перерисовок в секунду, размазанных по экрану — страница
// никогда не находится в стабильном состоянии, отсюда рваный рендер.
// Ручной клик по кнопке форсирует ОДИН общий re-render всего списка —
// и именно поэтому картинка на секунду чинится. Теперь тик общий для всей
// страницы (см. forceTick в TrackerPage) — все строки обновляются одним
// атомарным рендером раз в секунду, как при прокликивании всех кнопок
// разом, только автоматически.
export default function TrackerRow({ item, config, onKill, onVanish, onReset, onManualTime }: TrackerRowProps) {
  const [showModal, setShowModal] = useState(false);
  const index: number = item[config.indexKey];
  const [soundOn, setSoundOn] = useState(() => config.soundPrefs.isEnabled(index));

  const ms = config.getTimeLeftMs(item);
  const elap = config.formatElapsed(item.killed_at);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    config.soundPrefs.setEnabled(index, next);
  }

  const isDead    = config.getStatus(item) === 'dead';
  const isReady   = Boolean(item.spawn_at) && !isDead;
  const isWarning = isDead && ms <= 5 * 60_000;
  const meta      = config.getMeta(index);
  const pct       = config.getProgress(item);
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

  const spawnDisplay  = config.formatClock(item.spawn_at);
  const killedDisplay = config.formatClock(item.killed_at);

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
        <td className="td-name" data-label={config.rowNounLabel}>{meta.name}</td>
        <td className="td-square" data-label="Квадрат"><span className="square-badge">{meta.square}</span></td>
        <td className="td-timer" data-label="До спавна">
          {isReady
            ? <span className="spawn-tag">⚡ Спавн!</span>
            : <div className="prog-wrap">
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${pct * 100}%`, background: barColor }} />
                </div>
                <span className="timer-val" style={{ color: timerColor }}>
                  {isDead ? config.formatCountdown(ms) : '--:--'}
                </span>
              </div>
          }
        </td>
        <td className="td-actions" data-label="Действия">
          <div className="act-btns">
            {!isDead && !isReady
              ? <>
                  <button className="btn-now"  onClick={() => onKill(index)}>Сейчас</button>
                  <button className="btn-gone" onClick={() => onVanish(index)}>Исчез</button>
                </>
              : <button className="btn-reset-row" onClick={() => onReset(index)}>✕ Сброс</button>
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
        <td className="td-user" data-label="Игрок">{item.killer_nick || '—'}</td>
      </tr>

      {showModal && (
        <KillTimeModal
          itemName={meta.name}
          killedNounGenitive={config.killedNounGenitive}
          parseLocalTimeInput={config.parseLocalTimeInput}
          onCommit={iso => onManualTime(index, iso)}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
