import { createTrackerStore } from './createTrackerStore';
import { BEARS_CONFIG, DRAUGS_CONFIG } from './trackerConfig';

export const useBearsStore = createTrackerStore(BEARS_CONFIG.indexKey);
export const useDraugsStore = createTrackerStore(DRAUGS_CONFIG.indexKey);
