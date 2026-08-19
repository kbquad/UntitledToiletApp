// Runs firestore.rules against the real Firestore emulator and checks that
// the rules allow what they should and refuse what they shouldn't.
//   npm run test:rules
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, collectionGroup, getDocs, query, where,
} from 'firebase/firestore';
import fs from 'node:fs';

const ALICE = 'alice-uid';
const BOB = 'bob-uid';

const env = await initializeTestEnvironment({
  projectId: 'loo-rules-test',
  firestore: {
    rules: fs.readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
});

let failures = 0;
const check = async (label, promise) => {
  try {
    await promise;
    console.log('  ✓', label);
  } catch (e) {
    failures++;
    console.log('  ✗', label, '—', e.message.split('\n')[0]);
  }
};

const seedWashroom = async (id, extra = {}) => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'washrooms', id), {
      name: 'Test Washroom',
      type: 'Park',
      area: 'Downtown',
      lat: 51.05,
      lng: -114.06,
      fee: 'Free',
      needsKey: false,
      wheelchair: true,
      babyChange: false,
      genderNeutral: false,
      openFrom: 0,
      openTo: 24,
      status: 'published',
      reviewCount: 0,
      ratingSum: 0,
      cleanVotes: 0,
      ...extra,
    });
  });
};

const review = (authorId, over = {}) => ({
  authorId, washroomId: 'pub', washroomName: 'Test Washroom',
  rating: 5, body: 'Clean.', authorName: 'Alice', helpfulCount: 0,
  createdAt: new Date().toISOString(), ...over,
});

await env.clearFirestore();
await seedWashroom('pub');
await seedWashroom('hidden', { status: 'pending' });

const alice = env.authenticatedContext(ALICE).firestore();
const bob = env.authenticatedContext(BOB).firestore();
const anon = env.unauthenticatedContext().firestore();

console.log('\n1. reading washrooms');
await check('anyone can read a published washroom',
  assertSucceeds(getDoc(doc(anon, 'washrooms/pub'))));
await check('a pending washroom is hidden',
  assertFails(getDoc(doc(anon, 'washrooms/hidden'))));
// Firestore rules filter nothing — a query that *could* return a forbidden
// document is rejected outright. So the app must always narrow the query
// itself; this pins that requirement down.
await check('an unfiltered listing is refused (rules are not a filter)',
  assertFails(getDocs(collection(anon, 'washrooms'))));
await check('a listing narrowed to published succeeds',
  assertSucceeds(getDocs(query(collection(anon, 'washrooms'), where('status', '==', 'published')))));
await check('and returns only published washrooms', (async () => {
  const snap = await getDocs(query(collection(anon, 'washrooms'), where('status', '==', 'published')));
  if (snap.empty) throw new Error('expected at least one published washroom');
  if (snap.docs.some((d) => d.data().status !== 'published')) throw new Error('pending leaked into the list');
})());

console.log('\n2. posting a review');
await check('signed-in user can post their own review',
  assertSucceeds(setDoc(doc(alice, 'washrooms/pub/reviews', ALICE), review(ALICE))));
await check('cannot post a review under someone else’s id',
  assertFails(setDoc(doc(alice, 'washrooms/pub/reviews', BOB), review(BOB))));
await check('signed-out visitor cannot post',
  assertFails(setDoc(doc(anon, 'washrooms/pub/reviews', ALICE), review(ALICE))));
await check('rating above 5 is refused',
  assertFails(setDoc(doc(bob, 'washrooms/pub/reviews', BOB), review(BOB, { rating: 9 }))));
await check('rating below 1 is refused',
  assertFails(setDoc(doc(bob, 'washrooms/pub/reviews', BOB), review(BOB, { rating: 0 }))));
await check('over-long body is refused',
  assertFails(setDoc(doc(bob, 'washrooms/pub/reviews', BOB), review(BOB, { body: 'x'.repeat(601) }))));
await check('cannot start with a padded helpful count',
  assertFails(setDoc(doc(bob, 'washrooms/pub/reviews', BOB), review(BOB, { helpfulCount: 99 }))));

console.log('\n3. editing and deleting');
await check('author can edit their own review',
  assertSucceeds(updateDoc(doc(alice, 'washrooms/pub/reviews', ALICE), { rating: 3, body: 'Worse now.' })));
await check('someone else cannot edit it',
  assertFails(updateDoc(doc(bob, 'washrooms/pub/reviews', ALICE), { rating: 1, body: 'hacked' })));
await check('author cannot inflate their own helpful count',
  assertFails(updateDoc(doc(alice, 'washrooms/pub/reviews', ALICE), { helpfulCount: 500 })));
await check('someone else cannot delete it',
  assertFails(deleteDoc(doc(bob, 'washrooms/pub/reviews', ALICE))));

console.log('\n4. helpful votes');
await check('another user can add one helpful vote',
  assertSucceeds(setDoc(doc(bob, 'washrooms/pub/reviews', ALICE, 'helpful', BOB), { at: 'now' })));
await check('and bump the tally by exactly one',
  assertSucceeds(updateDoc(doc(bob, 'washrooms/pub/reviews', ALICE), { helpfulCount: 1 })));
await check('but cannot jump the tally by more',
  assertFails(updateDoc(doc(bob, 'washrooms/pub/reviews', ALICE), { helpfulCount: 50 })));
await check('cannot vote as another person',
  assertFails(setDoc(doc(bob, 'washrooms/pub/reviews', ALICE, 'helpful', ALICE), { at: 'now' })));
await check('can withdraw their own vote',
  assertSucceeds(deleteDoc(doc(bob, 'washrooms/pub/reviews', ALICE, 'helpful', BOB))));

console.log('\n5. washroom aggregate counters');
await check('a single review’s worth of change is allowed',
  assertSucceeds(updateDoc(doc(alice, 'washrooms', 'pub'), { reviewCount: 1, ratingSum: 5, cleanVotes: 1 })));
await check('inflating the count is refused',
  assertFails(updateDoc(doc(alice, 'washrooms', 'pub'), { reviewCount: 9999, ratingSum: 49995, cleanVotes: 9999 })));
await check('a rating sum beyond one review is refused',
  assertFails(updateDoc(doc(alice, 'washrooms', 'pub'), { ratingSum: 999 })));
await check('negative counters are refused',
  assertFails(updateDoc(doc(alice, 'washrooms', 'pub'), { reviewCount: -1 })));
await check('editing the name is refused',
  assertFails(updateDoc(doc(alice, 'washrooms', 'pub'), { name: 'Vandalised' })));
await check('flipping a pending washroom to published is refused',
  assertFails(updateDoc(doc(alice, 'washrooms', 'hidden'), { status: 'published' })));

console.log('\n6. submitting a washroom');
const submission = {
  name: 'New spot', type: 'Park', area: 'Calgary', lat: 51, lng: -114,
  fee: 'Free', needsKey: false, wheelchair: false, babyChange: false,
  genderNeutral: false, openFrom: 0, openTo: 24,
  status: 'pending', submittedBy: ALICE,
  reviewCount: 0, ratingSum: 0, cleanVotes: 0,
};
await check('can submit as pending',
  assertSucceeds(setDoc(doc(alice, 'washrooms', 'sub1'), submission)));
await check('cannot submit straight as published',
  assertFails(setDoc(doc(alice, 'washrooms', 'sub2'), { ...submission, status: 'published' })));
await check('cannot submit in someone else’s name',
  assertFails(setDoc(doc(alice, 'washrooms', 'sub3'), { ...submission, submittedBy: BOB })));
await check('cannot submit with a head start on ratings',
  assertFails(setDoc(doc(alice, 'washrooms', 'sub4'), { ...submission, reviewCount: 10, ratingSum: 50 })));
await check('an impossible latitude is refused',
  assertFails(setDoc(doc(alice, 'washrooms', 'sub5'), { ...submission, lat: 999 })));
await check('nobody can delete a washroom',
  assertFails(deleteDoc(doc(alice, 'washrooms', 'pub'))));

console.log('\n7. "my reviews" across all washrooms');
await check('a collection-group query for my own reviews works',
  assertSucceeds(getDocs(query(collectionGroup(alice, 'reviews'), where('authorId', '==', ALICE)))));
await check('and finds the review I wrote', (async () => {
  const snap = await getDocs(query(collectionGroup(alice, 'reviews'), where('authorId', '==', ALICE)));
  if (snap.empty) throw new Error('expected to find my review');
  if (snap.docs.some((d) => d.data().authorId !== ALICE)) throw new Error('someone else’s review came back');
})());
await check('a review must claim the washroom it actually lives under',
  assertFails(setDoc(doc(bob, 'washrooms/pub/reviews', BOB), review(BOB, { washroomId: 'somewhere-else' }))));

console.log('\n8. everything else is closed');
await check('unknown collections are locked',
  assertFails(setDoc(doc(alice, 'secrets', 'x'), { a: 1 })));

await env.cleanup();
console.log(failures === 0 ? '\nAll rules checks passed.\n' : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
