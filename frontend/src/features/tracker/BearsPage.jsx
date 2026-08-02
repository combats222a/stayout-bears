import TrackerPage from './TrackerPage';
import { BEARS_CONFIG } from './trackerConfig';
import { useBearsStore } from './stores';

export default function BearsPage({ clan, isGuest, onLoginClick }) {
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
