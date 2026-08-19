// Where the user is, kept current for as long as the app is open.
//
// The old behaviour asked the browser for a position exactly once, during
// onboarding, and wrote it to localStorage — so every distance, the "closest
// to you" card, the map's blue dot and the pin dropped by "Add a washroom"
// stayed at wherever you first opened the app, forever. This module replaces
// that with a live `watchPosition` subscription that writes into the store, so
// moving down the block re-sorts the list the way you'd expect.
//
// Everything here talks to the store rather than returning values, so any
// screen can read the current position without threading props around.
import { useStore, LOCATION_FRESH_MS } from '../store';
import { distanceMetres } from '../utils/geo';

const WATCH_OPTIONS = { enableHighAccuracy: true, timeout: 20000, maximumAge: 15000 };

// A fix the user explicitly asked for. A few seconds of cache is fine — that
// is still "now" — but nothing older, because they tapped the button precisely
// because the pin looked wrong.
const ONCE_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 };

// How long an explicit request waits before falling back on whatever the watch
// has delivered in the meantime.
const REQUEST_TIMEOUT_MS = 15000;

// A fix this recent, with the watch running, already *is* "where you are now" —
// answering from it beats making someone watch a spinner to be told the same
// thing.
const GOOD_ENOUGH_MS = 10000;

// Under this, a new reading is the same spot with GPS jitter on top; writing it
// would re-sort every list and re-render the map for nothing.
const MIN_MOVE_M = 12;

// …but a stationary fix still gets re-stamped this often, so standing still
// never makes the position look stale. Comfortably inside LOCATION_FRESH_MS.
const RESTAMP_MS = 45000;

const supported = () => typeof navigator !== 'undefined' && !!navigator.geolocation;

const status = () => useStore.getState().locationStatus;
const setStatus = (next) => {
  if (useStore.getState().locationStatus !== next) useStore.getState().setLocationStatus(next);
};

const toFix = (position) => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  accuracy: position.coords.accuracy ?? null,
  at: Date.now(),
});

// Returns the fix, whether or not it was worth writing.
const acceptFix = (position, { force = false } = {}) => {
  const fix = toFix(position);
  const held = useStore.getState().userLocation;

  const unchanged = !force && held
    && distanceMetres(held.lat, held.lng, fix.lat, fix.lng) < MIN_MOVE_M
    && fix.at - (held.at ?? 0) < RESTAMP_MS;

  if (!unchanged) useStore.getState().setUserLocation(fix);
  setStatus('tracking');

  // A fix arriving after a denial means permission came back — some browsers
  // grant it without ever firing a permission-change event, so reopen the
  // watch here rather than waiting for one.
  if (subscribers > 0) openWatch();

  return unchanged ? held : fix;
};

let watchId = null;
let subscribers = 0;

const clearWatch = () => {
  if (watchId === null) return;
  navigator.geolocation.clearWatch(watchId);
  watchId = null;
};

const handleError = (error) => {
  if (error?.code === error?.PERMISSION_DENIED || error?.code === 1) {
    // Permission won't come back on its own; drop the watch and wait for either
    // an explicit request or a permission-change event to restart it.
    setStatus('denied');
    clearWatch();
    return;
  }
  // POSITION_UNAVAILABLE / TIMEOUT are transient — a moving phone regains a fix
  // on its own, so keep the watch running and only say so if we have nothing.
  if (!useStore.getState().userLocation) setStatus('unavailable');
};

const openWatch = () => {
  if (watchId !== null || !supported()) return;
  // Only claim to be tracking if what we hold is actually current — a fix
  // restored from the last session is a starting point, not a live position.
  const held = useStore.getState().userLocation;
  setStatus(held && Date.now() - (held.at ?? 0) <= LOCATION_FRESH_MS ? 'tracking' : 'locating');
  watchId = navigator.geolocation.watchPosition(
    (position) => acceptFix(position),
    handleError,
    WATCH_OPTIONS,
  );
};

// Permission can be granted or revoked from browser UI while the app is open.
// Not every browser ships the Permissions API for geolocation, hence the guard.
let permissionWatched = false;
const followPermissionChanges = () => {
  if (permissionWatched || typeof navigator === 'undefined' || !navigator.permissions?.query) return;
  permissionWatched = true;
  navigator.permissions.query({ name: 'geolocation' }).then((result) => {
    result.onchange = () => {
      if (result.state === 'denied') {
        setStatus('denied');
        clearWatch();
      } else if (subscribers > 0) {
        openWatch();
      }
    };
  }).catch(() => { /* unsupported query name — the watch alone is enough */ });
};

// Ref-counted: StrictMode mounts effects twice in development, and it costs
// nothing to let more than one screen ask for tracking.
export const startWatchingLocation = () => {
  subscribers += 1;
  if (!supported()) { setStatus('unavailable'); return; }
  followPermissionChanges();
  if (status() !== 'denied') openWatch();
};

export const stopWatchingLocation = () => {
  subscribers = Math.max(0, subscribers - 1);
  if (subscribers === 0) clearWatch();
};

// An explicit "use my location" tap: may prompt for permission, and insists on
// a reading no older than a few seconds. Resolves with the fix, or null.
//
// It races two sources on purpose. A one-shot getCurrentPosition can sit there
// and time out on a cold GPS while the watch is delivering positions perfectly
// well — so a position arriving on the watch after the request started counts
// as an answer too. Whichever lands first wins, and only if neither produces
// anything do we report failure.
export const requestLocation = () => new Promise((resolve) => {
  if (!supported()) { setStatus('unavailable'); resolve(null); return; }
  followPermissionChanges();

  const startedAt = Date.now();
  const held = useStore.getState().userLocation;

  if (held && status() === 'tracking' && startedAt - (held.at ?? 0) <= GOOD_ENOUGH_MS) {
    resolve(held);
    return;
  }
  if (!held) setStatus('locating');

  // Registers as a watcher for the duration, so positions are flowing even if
  // no screen had asked for tracking yet — and released again on the way out.
  startWatchingLocation();

  let done = false;
  let timer = null;
  let unsubscribe = () => {};

  const finish = (fix) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    unsubscribe();
    stopWatchingLocation();
    resolve(fix);
  };

  unsubscribe = useStore.subscribe((state, previous) => {
    const fix = state.userLocation;
    if (fix && fix !== previous.userLocation && (fix.at ?? 0) >= startedAt) finish(fix);
  });

  timer = setTimeout(() => {
    // Nothing new arrived. A position from the last couple of minutes is still
    // a truthful answer to "where am I"; anything older is not.
    const latest = useStore.getState().userLocation;
    finish(latest && Date.now() - (latest.at ?? 0) <= LOCATION_FRESH_MS ? latest : null);
  }, REQUEST_TIMEOUT_MS);

  navigator.geolocation.getCurrentPosition(
    (position) => finish(acceptFix(position, { force: true })),
    (error) => {
      handleError(error);
      // Denial is final; a timeout or a momentary loss of signal is not, so
      // those keep waiting on the watch until REQUEST_TIMEOUT_MS is up.
      if (error?.code === 1) finish(null);
    },
    ONCE_OPTIONS,
  );
});

// A quiet top-up — used when the app comes back to the foreground, where some
// browsers have suspended the watch. Never prompts: if we were never allowed,
// this stays silent rather than nagging.
export const refreshLocation = () => {
  if (!supported() || status() === 'denied') return Promise.resolve(null);
  if (!useStore.getState().userLocation) return Promise.resolve(null);
  if (Date.now() - (useStore.getState().userLocation.at ?? 0) < LOCATION_FRESH_MS / 4) {
    return Promise.resolve(useStore.getState().userLocation);
  }
  return requestLocation();
};
