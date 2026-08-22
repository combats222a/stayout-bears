import { createValueStore } from '../../stores/createValueStore';
import type { ShiningStateData } from './ShiningPage';

export const useShiningStore = createValueStore<ShiningStateData | null>(null);
