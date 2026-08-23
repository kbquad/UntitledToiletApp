import { create } from 'zustand';
import * as db from './lib/db';
import { isProtected } from './lib/firebase';
import { cellKeyFor, coveredCellKeys, regionBox } from './utils/region';

// Shared, server-backed content: washrooms, their scores, and reviews.
// Personal preferences (theme, units, saved list) live in store.js instead.
export const useDataStore = create((set, get) => ({
  // Everything fetched so far this session, keyed by id. Regions accumulate
  // here as the user moves, and a washroom fetched twice simply overwrites
  // itself rather than appearing twice in the list.
  byId: {},
  washrooms: [],           // byId as an array, kept in step for the screens
  loadedCells: {},         // grid cells already fetched — see utils/region.js
  status: 'idle',          // idle | loading | ready | error
  error: null,

  reviewsByWashroom: {},   // { [id]: Review[] }
  reviewStatus: {},        // { [id]: 'loading' | 'ready' | 'error' }

  myReviews: [],
  myHelpfulReceived: 0,

  // Fetch the block of cells around a point, unless it is already covered.
  // Called with the user's position, and again whenever the map is moved
  // somewhere new.
  async loadRegion(lat, lng, { force = false } = {}) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const key = cellKeyFor(lat, lng);
    if (!force && get().loadedCells[key]) return;
    if (get().status === 'loading') return;

    set({ status: 'loading', error: null });
    try {
      await db.startSession();
      const found = await db.listWashroomsInBox(regionBox(lat, lng));

      set((s) => {
        const byId = { ...s.byId };
        for (const w of found) byId[w.id] = w;

        // Mark the whole block covered, not just the centre cell — one fetch
        // genuinely covered all nine.
        const loadedCells = { ...s.loadedCells };
        for (const k of coveredCellKeys(lat, lng)) loadedCells[k] = true;

        return {
          byId,
          washrooms: Object.values(byId).sort((a, b) => a.name.localeCompare(b.name)),
          loadedCells,
          status: 'ready',
        };
      });
    } catch (e) {
      set({ status: 'error', error: describe(e) });
    }
  },

  // After a write, the cached copy is stale. Forget the grid so the next look
  // refetches rather than showing a score that has already moved.
  invalidateRegions() {
    set({ loadedCells: {} });
  },

  async loadReviews(washroomId, { force = false } = {}) {
    const current = get().reviewStatus[washroomId];
    if (!force && (current === 'loading' || current === 'ready')) return;
    set((s) => ({ reviewStatus: { ...s.reviewStatus, [washroomId]: 'loading' } }));
    try {
      const reviews = await db.listReviews(washroomId);
      set((s) => ({
        reviewsByWashroom: { ...s.reviewsByWashroom, [washroomId]: reviews },
        reviewStatus: { ...s.reviewStatus, [washroomId]: 'ready' },
      }));
    } catch (e) {
      set((s) => ({
        reviewStatus: { ...s.reviewStatus, [washroomId]: 'error' },
        error: describe(e),
      }));
    }
  },

  // Posting changes the washroom's score, so refresh both.
  async submitReview(washroomId, review) {
    await db.saveReview(washroomId, review);
    const w = get().byId[washroomId];
    get().invalidateRegions();
    await Promise.all([
      get().loadReviews(washroomId, { force: true }),
      w ? get().loadRegion(w.lat, w.lng, { force: true }) : Promise.resolve(),
      get().loadProfile(),
    ]);
  },

  async toggleHelpful(washroomId, reviewId) {
    const list = get().reviewsByWashroom[washroomId] ?? [];
    const review = list.find((r) => r.id === reviewId);
    if (!review) return;
    const next = !review.votedByMe;

    // Optimistic: the count moves under the thumb, then reconciles.
    set((s) => ({
      reviewsByWashroom: {
        ...s.reviewsByWashroom,
        [washroomId]: list.map((r) => (r.id === reviewId
          ? { ...r, votedByMe: next, helpfulCount: r.helpfulCount + (next ? 1 : -1) }
          : r)),
      },
    }));

    try {
      await db.setHelpful(reviewId, next, washroomId);
    } catch (e) {
      set((s) => ({ reviewsByWashroom: { ...s.reviewsByWashroom, [washroomId]: list }, error: describe(e) }));
      throw e;
    }
  },

  async submitWashroom(washroom) {
    await db.suggestWashroom(washroom);
  },

  async loadProfile() {
    try {
      const [reviews, helpful] = await Promise.all([db.myReviews(), db.myHelpfulReceived()]);
      set({ myReviews: reviews, myHelpfulReceived: helpful });
    } catch {
      // A profile that can't load shouldn't take the whole screen down.
    }
  },

  clearError: () => set({ error: null }),
}));

function describe(e) {
  const message = e?.message ?? String(e);
  const code = e?.code ?? '';

  if (/Failed to fetch|NetworkError/i.test(message)) {
    return 'Can’t reach the database. Check your connection and that the Supabase project is running.';
  }

  // reCAPTCHA itself couldn't run — usually an ad blocker, a privacy extension
  // or a network that blocks Google. Worth naming, because "permission denied"
  // sends people looking in entirely the wrong place.
  if (String(code).startsWith('appCheck/') || /app.?check|recaptcha/i.test(message)) {
    return 'The spam check couldn’t run in this browser. Turn off any content blocker for this site, then try again.';
  }

  // App Check rejections reach Firestore as plain permission-denied, so this
  // has to cover both that and an ordinary rules refusal without guessing.
  if (code === 'permission-denied' && isProtected) {
    return 'That post was refused. If you’re using a content blocker or a VPN, the spam check may have failed — reload and try again.';
  }

  return message;
}
