import { create } from 'zustand';
import * as db from './lib/db';
import { isProtected } from './lib/firebase';

// Shared, server-backed content: washrooms, their scores, and reviews.
// Personal preferences (theme, units, saved list) live in store.js instead.
export const useDataStore = create((set, get) => ({
  washrooms: [],
  status: 'idle', // idle | loading | ready | error
  error: null,

  reviewsByWashroom: {},   // { [id]: Review[] }
  reviewStatus: {},        // { [id]: 'loading' | 'ready' | 'error' }

  myReviews: [],
  myHelpfulReceived: 0,

  async loadWashrooms({ force = false } = {}) {
    const { status } = get();
    if (!force && (status === 'loading' || status === 'ready')) return;
    set({ status: 'loading', error: null });
    try {
      await db.startSession();
      set({ washrooms: await db.listWashrooms(), status: 'ready' });
    } catch (e) {
      set({ status: 'error', error: describe(e) });
    }
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
    await Promise.all([
      get().loadReviews(washroomId, { force: true }),
      get().loadWashrooms({ force: true }),
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
