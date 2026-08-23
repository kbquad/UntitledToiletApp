// Deletes every washroom, review and helpful vote in the database.
//
//   npm run wipe -- --confirm=DELETE-EVERYTHING
//   npm run wipe -- --confirm=DELETE-EVERYTHING --emulator
//
// This is irreversible. Firestore has no undo, and unless you have a Datastore
// export from before it runs, the reviews people wrote are gone for good. The
// confirmation flag is not decoration — the script refuses to do anything
// without it, so nobody wipes production by pressing up-arrow in a shell.
import { resolveProjectId, connect, commitInBatches } from './lib/firestore-admin.mjs';

const CONFIRMATION = 'DELETE-EVERYTHING';

const argv = process.argv.slice(2);
const useEmulator = argv.includes('--emulator');
const confirm = argv.find((a) => a.startsWith('--confirm='))?.split('=')[1];

if (confirm !== CONFIRMATION) {
  console.error(`
This deletes every washroom and every review, permanently.

To go ahead, re-run with the confirmation flag:

  npm run wipe -- --confirm=${CONFIRMATION}

Add --emulator to wipe the local emulator instead of the real project.
`);
  process.exit(1);
}

const projectId = resolveProjectId(argv);
if (!projectId) {
  console.error('Could not work out which Firebase project to wipe. Pass --project=your-project-id');
  process.exit(1);
}

const db = await connect({ projectId, useEmulator });

// Subcollections are not deleted with their parent — Firestore keeps them as
// orphans that still answer collection-group queries. So walk down and delete
// the leaves first.
const deleteSubcollection = async (ref, name) => {
  const snap = await ref.collection(name).get();
  if (snap.empty) return 0;
  await commitInBatches(db, snap.docs, (batch, d) => batch.delete(d.ref));
  return snap.size;
};

console.log(`\nWiping ${projectId}…\n`);

const washrooms = await db.collection('washrooms').get();
console.log(`${washrooms.size} washrooms to remove`);

let reviews = 0;
let votes = 0;

for (const washroom of washrooms.docs) {
  const reviewSnap = await washroom.ref.collection('reviews').get();
  for (const review of reviewSnap.docs) {
    votes += await deleteSubcollection(review.ref, 'helpful');
  }
  reviews += await deleteSubcollection(washroom.ref, 'reviews');
}

await commitInBatches(db, washrooms.docs, (batch, d) => batch.delete(d.ref));

console.log(`
Done. Deleted:
  ${washrooms.size} washrooms
  ${reviews} reviews
  ${votes} helpful votes

The database is empty. Run \`npm run import:osm\` to fill it again.
`);
process.exit(0);
