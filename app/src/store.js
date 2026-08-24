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
      //
      // Deliberately NOT persisted. Where someone was is not ours to keep
      // between visits: the app asks again each time it opens and the fix dies
      // with the tab. See lib/geolocation.js.
      userLocation: null,

      // idle | locating | tracking | denied | unavailable.
      // Deliberately NOT persisted: permission can be changed in browser
      // settings between visits, so it has to be re-established each load.
      locationStatus: 'idle',

      displayName: '',      // optional; blank posts as "A local"

      // The design opens dark, on blue. Only new installs get these — anyone
      // who has already picked a colour or an appearance keeps their choice,
      // which is why this is a default rather than a migration.
      hue: 258,
      dark: true,
      units: 'Metric',

      // 'Exact' measures from the fix the browser gives; 'General' rounds it to
      // roughly a neighbourhood first. The design offers the choice, and it is
      // a real one — a rounded position is still useful for "what's nearby"
      // while being a good deal less revealing.
      locationAccuracy: 'Exact',
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
      forgetLocation: () => set({ userLocation: null, locationStatus: 'idle' }),
      setDisplayName: (displayName) => set({ displayName }),

      setHue: (hue) => set({ hue }),
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      setDark: (dark) => set({ dark }),
      setUnits: (units) => set({ units }),
      setLocationAccuracy: (locationAccuracy) => set({ locationAccuracy }),
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
      version: 4,
      partialize: (s) => ({
        onboarded: s.onboarded,
        displayName: s.displayName,
        hue: s.hue,
        dark: s.dark,
        units: s.units,
        locationAccuracy: s.locationAccuracy,
        notify: s.notify,
        saved: s.saved,
        sort: s.sort,
        filters: s.filters,
        radius: s.radius,
        minClean: s.minClean,
        reviewFilter: s.reviewFilter,
      }),
      // v2 captured one position during onboarding and kept it forever; v3
      // timestamped it. v4 stops storing it at all, so the migration's job is
      // to drop what earlier versions left behind on people's devices.
      migrate: (state, version) => {
        if (version >= 4 || !state) return state;
        const { userLocation: _dropped, ...rest } = state;
        return rest;
      },
    },
  ),
);
