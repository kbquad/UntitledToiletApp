import { create } from 'zustand';
import { makeChallenge, isCorrect } from './lib/captcha';

// A pass lasts long enough to write a review and add the washroom next to it
// without being asked twice, and not so long that a shared or forgotten tab
// stays waved through.
export const HUMAN_PASS_MS = 10 * 60 * 1000;

// Never persisted: a fresh visit answers a fresh question.
export const useCaptchaStore = create((set, get) => ({
  challenge: makeChallenge(),
  passedUntil: 0,
  wrongAnswers: 0,

  newChallenge: () => set({ challenge: makeChallenge() }),

  // Every wrong answer burns the question, so a script can't sit on one
  // prompt and grind through the possible answers.
  submitAnswer: (value) => {
    if (!isCorrect(get().challenge, value)) {
      set((s) => ({ wrongAnswers: s.wrongAnswers + 1, challenge: makeChallenge() }));
      return false;
    }
    set({ passedUntil: Date.now() + HUMAN_PASS_MS, wrongAnswers: 0 });
    return true;
  },

  // Fails a check the honeypot or the timing caught, without saying which.
  rejectSilently: () => set((s) => ({ wrongAnswers: s.wrongAnswers + 1, challenge: makeChallenge() })),

  // Checked again at submit time: an expired pass is dropped here, which
  // re-renders the form with a new question rather than posting on a stale one.
  stillPassed: () => {
    if (get().passedUntil > Date.now()) return true;
    if (get().passedUntil) set({ passedUntil: 0, challenge: makeChallenge() });
    return false;
  },

  reset: () => set({ passedUntil: 0, wrongAnswers: 0, challenge: makeChallenge() }),
}));
