import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import InfoSpoiler from '../../components/InfoSpoiler';
import GuestLock from '../../components/GuestLock';
import TrackerRow from './components/TrackerRow';
import type { TrackerConfig } from './trackerConfig';
import type { createTrackerStore, TrackerItem } from './createTrackerStore';
import type { Clan } from '../../types/entities';

type TrackerStoreHook = ReturnType<typeof createTrackerStore>;

interface TrackerPageProps {
  config: TrackerConfig;
  useStore: TrackerStoreHook;
  clan: Clan | null;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

// config — TrackerConfig (BEARS_CONFIG или DRAUGS_CONFIG)
// useStore — соответствующий хук из stores.ts (useBearsStore / useDraugsStore)
export default function TrackerPage({ config, useStore, clan, isGuest, onLoginClick = () => {} }: TrackerPageProps) {
  const [error, setError] = useState('');
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const items = useStore((s) => s.items);

  // Один общий тик на всю страницу вместо ~11 независимых setInterval со
  // случайным сдвигом на каждую строку (см. комментарий в TrackerRow). Любое
  // изменение этого состояния триггерит re-render TrackerPage, а значит и
  // ВСЕХ TrackerRow разом (они не обёрнуты в memo) — то есть один атомарный
  // рендер всего списка раз в секунду, а не размазанный поток частичных
  // обновлений.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mergedItems: TrackerItem[] = config.list.map(meta => {
    const found = items.find(i => i[config.indexKey] === meta.index);
    return found || { [config.indexKey]: meta.index, spawn_at: null, killed_at: null, killer_nick: null };
  });

  const active = mergedItems.filter(i => config.getStatus(i) === 'dead').length;
  const ready  = mergedItems.filter(i => i.spawn_at && config.getStatus(i) === 'alive').length;

  async function killItem(index: number, killedAt?: string) {
    setError('');
    try {
      const body = killedAt ? { killed_at: killedAt } : {};
      const res = await api.post(`${config.apiPath}/${index}/kill`, body);
      useStore.getState().updateItem({ ...res[config.responseKey] });
    } catch (e) { setError((e as Error).message); }
  }

  async function vanishItem(index: number) {
    const killedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await killItem(index, killedAt);
  }

  async function resetItem(index: number) {
    setError('');
    try {
      const res = await api.post(`${config.apiPath}/${index}/reset`);
      useStore.getState().updateItem({ ...res[config.responseKey] });
    } catch (e) { setError((e as Error).message); }
  }

  async function handleManualTime(index: number, killedAtIso: string) {
    await killItem(index, killedAtIso);
  }

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">{config.pageTitleGuest}</h2>
        <InfoSpoiler {...config.spoiler} storageKey={config.spoilerStorageKey} />
        {isGuest ? (
          <GuestLock
            icon={config.guestLock.icon}
            title={config.guestLock.title}
            text={config.guestLock.text}
            onLoginClick={onLoginClick}
          />
        ) : (
          <div className="empty-state"><p>Вступи в клан чтобы отслеживать {config.trackingNounGenitive}</p></div>
        )}
      </div>
    );
  }

  return (
    <div className="page bears-page">
      <div className="bears-hdr">
        <h2 className="page-title">{config.headerTitle(clan.name)}</h2>
        <div className="stat-pills">
          {active > 0 && <span className="pill pill-blue">⏱ {active} таймер{active > 1 ? 'а' : ''}</span>}
          {ready  > 0 && <span className="pill pill-green">⚡ {ready} спавн!</span>}
        </div>
      </div>
      <InfoSpoiler {...config.spoiler} storageKey={config.spoilerStorageKey} />
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
            {mergedItems.map(item => (
              <TrackerRow
                key={item[config.indexKey]}
                item={item}
                config={config}
                onKill={killItem}
                onVanish={vanishItem}
                onReset={resetItem}
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
        ⚡ Звук за 5 мин до спавна · «Исчез» — {config.vanishedNoun} пропал ~5 мин назад · ✎ Нажми на «Время смерти» чтобы исправить
      </div>
    </div>
  );
}
