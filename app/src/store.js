import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Personal preferences only — these are genuinely per-device and stay in this
// browser. Shared content (washrooms, reviews, scores) lives in the database;
// see dataStore.js.
const defaultFilters = {
  wheelchair: false, babyChange: false, genderNeutral: false,
  free: false, openNow: false, noKey: false,
};

// How long a fix counts as "where you are" rather than "where you last were".
// The watcher in lib/geolocation.js re-stamps a standing-still fix well inside
// this, so the only way to go stale is to genuinely stop receiving positions.
export const LOCATION_FRESH_MS = 2 * 60 * 1000;

export const useStore = create(
  persist(
    (set) => ({
      onboarded: false,

      // { lat, lng, accuracy, at } — `at` is when the browser gave us the fix.
      // Kept in localStorage so the first paint after a reload can sort by
      // roughly-right distances, then corrected by the live watcher.
      userLocation: null,

      // idle | locating | tracking | denied | unavailable.
      // Deliberately NOT persisted: permission can be changed in browser
      // settings between visits, so it has to be re-established each load.
      locationStatus: 'idle',

      displayName: '',      // optional; blank posts as "A local"
      hue: 340,
      dark: false,
      units: 'Metric',
      notify: true,

      saved: [],            // your own shortlist

      sort: 'Closest',
      filters: defaultFilters,
      radius: 5000,
      minClean: 0,
      reviewFilter: 'Most recent',

      setOnboarded: (v) => set({ onboarded: v }),
      setUserLocation: (loc) => set({ userLocation: loc }),
      setLocationStatus: (locationStatus) => set({ locationStatus }),
      setDisplayName: (displayName) => set({ displayName }),

      setHue: (hue) => set({ hue }),
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      setDark: (dark) => set({ dark }),
      setUnits: (units) => set({ units }),
      toggleNotify: () => set((s) => ({ notify: !s.notify })),

      toggleSaved: (id) => set((s) => ({
        saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
      })),

      setSort: (sort) => set({ sort }),
      toggleFilter: (key) => set((s) => ({ filters: { ...s.filters, [key]: !s.filters[key] } })),
      setRadius: (radius) => set({ radius }),
      setMinClean: (minClean) => set({ minClean }),
      clearFilters: () => set({ filters: defaultFilters, radius: 5000, minClean: 0 }),
      setReviewFilter: (reviewFilter) => set({ reviewFilter }),
    }),
    {
      name: 'loo-preferences',
      version: 3,
      partialize: (s) => ({
        onboarded: s.onboarded,
        userLocation: s.userLocation,
        displayName: s.displayName,
        hue: s.hue,
        dark: s.dark,
        units: s.units,
        notify: s.notify,
        saved: s.saved,
        sort: s.sort,
        filters: s.filters,
        radius: s.radius,
        minClean: s.minClean,
        reviewFilter: s.reviewFilter,
      }),
      // v2 stored a bare { lat, lng } captured once during onboarding and never
      // touched again. Keep the coordinates as a starting point, but timestamp
      // them as ancient so they read as "last known" until a real fix lands.
      migrate: (state, version) => {
        if (version >= 3 || !state) return state;
        return {
          ...state,
          userLocation: state.userLocation
            ? { lat: state.userLocation.lat, lng: state.userLocation.lng, accuracy: null, at: 0 }
            : null,
        };
      },
    },
  ),
);
