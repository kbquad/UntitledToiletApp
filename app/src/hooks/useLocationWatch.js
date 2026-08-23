import { useEffect } from 'react';
import { useStore } from '../store';
import {
  startWatchingLocation, stopWatchingLocation, refreshLocation, requestLocation,
} from '../lib/geolocation';

// Mounted once, at the app root.
//
// Two rules, and they pull in opposite directions:
//
//   • While the app is open, the browser keeps telling us where the user is,
//     so distances and sorting follow them instead of freezing at whatever
//     position the app first saw.
//   • The moment they leave, that position is gone. It is never written to
//     localStorage, and it is wiped when the page is closed, so a shared or
//     borrowed device does not hand the next person a map centred on the last
//     one's street.
//
// Asking on open is a real request every session. Worth being clear about what
// the browser will and won't do: it re-prompts only until someone answers for
// this site. Once they allow it, the browser answers on their behalf from then
// on, and no site can force the dialog to reappear. What we control is that we
// ask each session and keep nothing afterwards.
export const useLocationWatch = () => {
  const onboarded = useStore((s) => s.onboarded);
  const forgetLocation = useStore((s) => s.forgetLocation);

  useEffect(() => {
    // During onboarding the user taps "Use my location" themselves; asking
    // underneath that screen would put the browser dialog up unprompted.
    if (!onboarded) return undefined;

    requestLocation();
    startWatchingLocation();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshLocation();
    };

    // pagehide fires on close, reload and navigating away — including the
    // cases iOS Safari never sends unload for.
    const onLeave = () => { forgetLocation(); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onLeave);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onLeave);
      stopWatchingLocation();
      forgetLocation();
    };
  }, [onboarded, forgetLocation]);
};
