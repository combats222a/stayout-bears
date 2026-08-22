import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import InfoSpoiler from '../../components/InfoSpoiler';
import GuestLock from '../../components/GuestLock';
import TrackerRow from './components/TrackerRow';
import type { TrackerConfig } from './trackerConfig';
import type { createTrackerStore, TrackerItem } from './createTrackerStore';
import type { Clan } from '../../types/entities';
import { useI18n } from '../../i18n';

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
  const { t, locale } = useI18n();
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
        <h2 className="page-title">{config.pageTitleGuest[locale]}</h2>
        <InfoSpoiler {...config.spoiler[locale]} storageKey={config.spoilerStorageKey} />
        {isGuest ? (
          <GuestLock
            icon={config.guestLock.icon}
            title={config.guestLock.title[locale]}
            text={config.guestLock.text[locale]}
            onLoginClick={onLoginClick}
          />
        ) : (
          <div className="empty-state"><p>{t('tracker.joinClanPrefix')} {config.trackingNounGenitive[locale]}</p></div>
        )}
      </div>
    );
  }

  return (
    <div className="page bears-page">
      <div className="bears-hdr">
        <h2 className="page-title">{config.headerTitle(clan.name, locale)}</h2>
        <div className="stat-pills">
          {active > 0 && <span className="pill pill-blue">⏱ {active} {active > 1 ? t('tracker.timerWordPlural') : t('tracker.timerWord')}</span>}
          {ready  > 0 && <span className="pill pill-green">⚡ {ready} {t('tracker.spawnBangSuffix')}</span>}
        </div>
      </div>
      <InfoSpoiler {...config.spoiler[locale]} storageKey={config.spoilerStorageKey} />
      {error && <div className="error-msg">{error}</div>}

      <div className="tbl-wrap">
        <table className="bears-table">
          <thead>
            <tr>
              <th></th>
              <th>{config.rowNounLabel[locale]}</th>
              <th>{t('tracker.colSquare')}</th>
              <th>{t('tracker.colToSpawn')}</th>
              <th>{t('tracker.colActions')}</th>
              <th>{t('tracker.colSpawnTime')}</th>
              <th>{t('tracker.colElapsed')}</th>
              <th>{t('tracker.colDeathTime')}</th>
              <th>{t('tracker.colPlayer')}</th>
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
          {t('tracker.timezoneLabel')} <span className="tbl-timezone-value">{userTimezone}</span>
        </div>
      </div>
      <div className="tbl-hint">
        {t('tracker.tableHint')} {config.vanishedNoun[locale]} {t('tracker.tableHintVanishedSuffix')}
      </div>
    </div>
  );
}
