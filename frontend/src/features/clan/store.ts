import { createValueStore } from '../../stores/createValueStore';
import type { Clan, ClanMemberSummary, ClanBanSummary } from '../../types/entities';

export const useClanStore = createValueStore<Clan | null>(null);
export const useMembersStore = createValueStore<ClanMemberSummary[]>([]);
export const useBansStore = createValueStore<ClanBanSummary[]>([]);
