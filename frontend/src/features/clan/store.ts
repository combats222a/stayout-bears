import { createValueStore } from '../../stores/createValueStore';

export const useClanStore = createValueStore(null);
export const useMembersStore = createValueStore([]);
export const useBansStore = createValueStore([]);
