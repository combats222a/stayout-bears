import { createValueStore } from '../../stores/createValueStore';
import type { AnomalyStateData } from './AnomalyPage';

export const useAnomalyStore = createValueStore<AnomalyStateData | null>(null);
