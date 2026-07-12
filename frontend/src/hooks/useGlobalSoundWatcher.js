import { useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { playSpawnSound, playShiningWarningSound, playTimerDoneSound } from '../utils/sound';
import { isBearSoundEnabled, isDraugSoundEnabled, isShiningSoundEnabled } from '../utils/soundPrefs';
import { getTimeLeftMs, WARN_BEFORE_SPAWN_MS } from '../utils/bears';
import { getTimeLeftMs as getDraugTimeLeftMs, WARN_BEFORE_SPAWN_MS as DRAUG_WARN_BEFORE_SPAWN_MS } from '../utils/draugs';
import { computeShiningSlots } from '../utils/shining';

function getTimerRemainingSeconds(timer) {
  if (!timer.last_reset_at) return null;
  const resetMs = new Date(timer.last_reset_at).getTime();
  const expireMs = resetMs + timer.period_seconds * 1000;
  return (expireMs - Date.now()) / 1000;
}

/**
 * Раньше звук за медведей/сияние/таймеры проигрывался только внутри
 * соответствующей страницы (BearsPage/ShiningPage/TimersPage), а значит
 * срабатывал только пока эта вкладка была открыта — например, звук
 * таймера был слышен на вкладке "Таймеры", но не на "Медведи" или "Сияние".
 *
 * Этот хук живёт на уровне App (который не размонтируется при переключении
 * разделов сайта) и проверяет все три события раз в секунду независимо от
 * того, какая вкладка сейчас открыта — пока открыт сам сайт, звук работает
 * везде.
 */
export function useGlobalSoundWatcher({ token, bears, draugs, shiningData }) {
  const bearStateRef = useRef({});     // { [bear_index]: { key, warned } }
  const draugStateRef = useRef({});    // { [draug_index]: { key, warned } }
  const shiningStateRef = useRef(null); // { key, burning }
  const timersListRef = useRef([]);     // последний загруженный список таймеров
  const timerStateRef = useRef({});     // { [timer.id]: { key, wasExpired } }

  // Фоновая подгрузка таймеров пользователя — независимо от того, открыта
  // ли страница "Таймеры". Только сама проверка истечения, без отображения
  // в интерфейсе.
  useEffect(() => {
    if (!token) {
      timersListRef.current = [];
      return;
    }
    let cancelled = false;

    async function loadTimers() {
      try {
        const data = await api.get('/timers');
        if (!cancelled) timersListRef.current = data.timers || [];
      } catch {
        // Фоновая проверка — молча игнорируем сетевые ошибки
      }
    }

    loadTimers();
    const id = setInterval(loadTimers, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  useEffect(() => {
    const id = setInterval(() => {
      // ── Медведи: сигнал за 5 минут до спавна ──
      if (Array.isArray(bears)) {
        for (const bear of bears) {
          if (!bear.spawn_at) continue;
          const key = `${bear.spawn_at}|${bear.killed_at}`;
          const msLeft = getTimeLeftMs(bear);
          let entry = bearStateRef.current[bear.bear_index];
          if (!entry || entry.key !== key) {
            // Состояние медведя обновилось (убит/сброшен) — инициализируем
            // реф РЕАЛЬНЫМ текущим состоянием, чтобы не пикнуть ложно сразу.
            entry = { key, warned: msLeft <= WARN_BEFORE_SPAWN_MS };
            bearStateRef.current[bear.bear_index] = entry;
          }
          if (msLeft > 0 && msLeft <= WARN_BEFORE_SPAWN_MS && !entry.warned) {
            entry.warned = true;
            if (isBearSoundEnabled(bear.bear_index)) playSpawnSound();
          }
        }
      }

      // ── Драуги: сигнал за 5 минут до спавна ──
      if (Array.isArray(draugs)) {
        for (const draug of draugs) {
          if (!draug.spawn_at) continue;
          const key = `${draug.spawn_at}|${draug.killed_at}`;
          const msLeft = getDraugTimeLeftMs(draug);
          let entry = draugStateRef.current[draug.draug_index];
          if (!entry || entry.key !== key) {
            entry = { key, warned: msLeft <= DRAUG_WARN_BEFORE_SPAWN_MS };
            draugStateRef.current[draug.draug_index] = entry;
          }
          if (msLeft > 0 && msLeft <= DRAUG_WARN_BEFORE_SPAWN_MS && !entry.warned) {
            entry.warned = true;
            if (isDraugSoundEnabled(draug.draug_index)) playSpawnSound();
          }
        }
      }

      // ── Гора Сияния: сигнал в момент начала ──
      if (shiningData?.gameTimeStr && shiningData?.anchorRealMs) {
        const key = `${shiningData.gameTimeStr}|${shiningData.anchorRealMs}`;
        const now = Date.now();
        const slot0 = computeShiningSlots(shiningData.gameTimeStr, shiningData.anchorRealMs, now)[0];
        const burning = now >= slot0.realStartMs && now < slot0.realEndMs;
        let entry = shiningStateRef.current;
        if (!entry || entry.key !== key) {
          entry = { key, burning };
          shiningStateRef.current = entry;
        }
        if (burning && !entry.burning) {
          if (isShiningSoundEnabled()) playShiningWarningSound();
        }
        entry.burning = burning;
      }

      // ── Таймеры: сигнал в момент истечения ──
      for (const timer of timersListRef.current) {
        const key = `${timer.last_reset_at}|${timer.period_seconds}`;
        const remaining = getTimerRemainingSeconds(timer);
        const isExpired = remaining !== null && remaining <= 0;
        let entry = timerStateRef.current[timer.id];
        if (!entry || entry.key !== key) {
          entry = { key, wasExpired: isExpired };
          timerStateRef.current[timer.id] = entry;
        }
        if (isExpired && !entry.wasExpired && timer.sound_enabled) {
          playTimerDoneSound();
        }
        entry.wasExpired = isExpired;
      }
    }, 1000);

    return () => clearInterval(id);
  }, [bears, draugs, shiningData]);
}
