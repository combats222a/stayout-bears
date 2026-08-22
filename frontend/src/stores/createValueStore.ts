import { create } from 'zustand';

// В отличие от createTrackerStore (features/tracker) — тут нет массива
// с обновлением по индексу, только "текущее значение целиком": так жили
// clan/members/bans/shiningData/anomalyData в App.jsx (useState + setX(...)
// на весь объект/массив разом, без точечных патчей по id).
export function createValueStore<T>(initialValue: T) {
  return create<{ value: T; setValue: (v: T) => void; reset: () => void }>((set) => ({
    value: initialValue,
    setValue: (v) => set({ value: v }),
    reset: () => set({ value: initialValue }),
  }));
}
