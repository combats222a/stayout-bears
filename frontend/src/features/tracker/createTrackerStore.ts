import { create } from 'zustand';

export interface TrackerItem {
  [key: string]: any;
  spawn_at: string | null;
  killed_at: string | null;
  killer_nick?: string | null;
}

interface TrackerStoreState {
  items: TrackerItem[];
  setItems: (items: TrackerItem[]) => void;
  updateItem: (item: TrackerItem) => void;
  reset: () => void;
}

// indexKey — 'bear_index' | 'draug_index' — какое поле в item однозначно
// идентифицирует строку (нужно для updateItem: заменить строку с тем же
// индексом, как раньше делал setBears(prev => prev.map(...))).
export function createTrackerStore(indexKey: string) {
  return create<TrackerStoreState>((set) => ({
    items: [],
    setItems: (items) => set({ items: items || [] }),
    updateItem: (item) =>
      set((state) => ({
        items: state.items.map((i) => (i[indexKey] === item[indexKey] ? item : i)),
      })),
    reset: () => set({ items: [] }),
  }));
}
