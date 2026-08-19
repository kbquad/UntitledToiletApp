import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Personal preferences only — these are genuinely per-device and stay in this
// browser. Shared content (washrooms, reviews, scores) lives in the database;
// see dataStore.js.
const defaultFilters = {
  wheelchair: false, babyChange: false, genderNeutral: false,
  free: false, openNow: false, noKey: false,
};

export const useStore = create(
  persist(
    (set) => ({
      onboarded: false,
      userLocation: null,

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
    { name: 'loo-preferences', version: 2 },
  ),
);
