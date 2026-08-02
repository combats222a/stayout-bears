import TrackerPage from './TrackerPage';
import { DRAUGS_CONFIG } from './trackerConfig';
import { useDraugsStore } from './stores';

export default function DraugsPage({ clan, isGuest, onLoginClick }) {
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
