// A small human check for the two screens that write public content.
//
// Deliberately self-contained: no third-party script, no site key, no extra
// network call, and it works in demo mode and offline exactly as it does
// live — the same reasoning that keeps this app on keyless map tiles.
//
// Be clear about what it is. The challenge is generated and graded in the
// browser, so a determined script that reads the page can beat it; what it
// stops is the ordinary case — drive-by form spam that posts blind. The
// server-side counterpart is Firebase App Check, which Firestore can enforce
// on every write; see SETUP.md. Treat this as the first of the two, not a
// replacement for it.

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
];

const COUNTABLE = ['washroom', 'soap', 'towel', 'sink', 'queue', 'clean', 'stall'];

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (list) => list[randomInt(0, list.length - 1)];

// One side spelled out and one in digits, so the answer isn't sitting in the
// prompt as a plain "3 + 4" a naive parser can lift.
const sumChallenge = () => {
  const a = randomInt(2, 9);
  const b = randomInt(1, 5);
  return { prompt: `What is ${NUMBER_WORDS[a]} plus ${b}?`, answer: a + b };
};

const differenceChallenge = () => {
  const a = randomInt(6, 12);
  const b = randomInt(1, 4);
  return { prompt: `What is ${a} minus ${NUMBER_WORDS[b]}?`, answer: a - b };
};

const lettersChallenge = () => {
  const word = pick(COUNTABLE);
  return { prompt: `How many letters are in the word “${word}”?`, answer: word.length };
};

const KINDS = [sumChallenge, differenceChallenge, lettersChallenge];

export const makeChallenge = () => ({
  // Only used as a React key, so a re-roll visibly resets the field.
  id: `${Date.now().toString(36)}-${randomInt(0, 1e6).toString(36)}`,
  ...pick(KINDS)(),
});

// Digits or the spelled-out word both count — "seven" is a perfectly good
// answer to a question that asked in words.
export const isCorrect = (challenge, input) => {
  if (!challenge) return false;
  const given = String(input ?? '').trim().toLowerCase().replace(/[.!]+$/, '');
  if (!given) return false;
  return given === String(challenge.answer) || given === NUMBER_WORDS[challenge.answer];
};

// Nobody reads a question and types the answer this fast; a script does.
export const MIN_THINK_MS = 1200;
