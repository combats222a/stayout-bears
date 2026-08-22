import TrackerPage from './TrackerPage';
import { BEARS_CONFIG } from './trackerConfig';
import { useBearsStore } from './stores';
import type { Clan } from '../../types/entities';

interface BearsPageProps {
  clan: Clan | null;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

export default function BearsPage({ clan, isGuest, onLoginClick }: BearsPageProps) {
  return (
    <TrackerPage
      config={BEARS_CONFIG}
      useStore={useBearsStore}
      clan={clan}
      isGuest={isGuest}
      onLoginClick={onLoginClick}
    />
  );
}
