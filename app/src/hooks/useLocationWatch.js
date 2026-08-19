import { useEffect } from 'react';
import { startWatchingLocation, stopWatchingLocation, refreshLocation } from '../lib/geolocation';

// Mounted once, at the app root. From then on the browser keeps telling us
// where the user is, so distances, sorting and the map's blue dot follow them
// around instead of freezing at wherever the app was first opened.
//
// It does not prompt: with permission already granted the watch just starts,
// and without it the app carries on from the fallback point until someone taps
// "Use my location".
export const useLocationWatch = () => {
  useEffect(() => {
    startWatchingLocation();

    // Backgrounded tabs stop receiving positions on several browsers, so take
    // a fresh reading the moment the app is on screen again.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshLocation();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopWatchingLocation();
    };
  }, []);
};
