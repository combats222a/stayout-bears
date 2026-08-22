import TrackerPage from './TrackerPage';
import { DRAUGS_CONFIG } from './trackerConfig';
import { useDraugsStore } from './stores';
import type { Clan } from '../../types/entities';

interface DraugsPageProps {
  clan: Clan | null;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

export default function DraugsPage({ clan, isGuest, onLoginClick }: DraugsPageProps) {
  return (
    <TrackerPage
      config={DRAUGS_CONFIG}
      useStore={useDraugsStore}
      clan={clan}
      isGuest={isGuest}
      onLoginClick={onLoginClick}
    />
  );
}
