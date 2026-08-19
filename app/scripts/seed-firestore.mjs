// Loads the starter Calgary washroom locations into Firestore.
//
//   npm run seed            # against your real project, via ADC
//   npm run seed:emulator   # against the local emulator
//
// Authentication is Application Default Credentials — there are no service
// account JSON keys to download, store or leak. ADC resolves, in order:
//   • locally      → `gcloud auth application-default login`
//   • on GCP       → the service account attached to the Cloud Run / Cloud
//                    Functions / GCE / GKE resource
//   • in CI        → Workload Identity Federation
//
// Locations only — no ratings and no reviews. Those come from real people.
// Safe to re-run: it updates the descriptive fields of existing washrooms and
// never touches their scores or reviews.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'node:fs';
import { WASHROOMS } from '../src/data/locations.js';

const useEmulator = process.argv.includes('--emulator');

// Minimal .env reader so the project id can come from the file you already
// filled in, without pulling in a dependency.
const envFileValue = (key) => {
  try {
    const line = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith(`${key}=`));
    return line?.slice(line.indexOf('=') + 1).trim() || null;
  } catch {
    return null;
  }
};

const flagValue = process.argv.find((a) => a.startsWith('--project='))?.split('=')[1];

const projectId = flagValue
  ?? process.env.GOOGLE_CLOUD_PROJECT
  ?? process.env.FIREBASE_PROJECT_ID
  ?? envFileValue('VITE_FIREBASE_PROJECT_ID')
  ?? (useEmulator ? 'demo-loo' : null);

if (!projectId) {
  console.error(`
Could not work out which Firebase project to seed.

Set it any one of these ways:
  • put VITE_FIREBASE_PROJECT_ID in app/.env   (you have probably done this already)
  • export GOOGLE_CLOUD_PROJECT=your-project-id
  • npm run seed -- --project=your-project-id
`);
  process.exit(1);
}

const signInHelp = `
No Application Default Credentials found.

Sign in once on this machine, then re-run:

  gcloud auth application-default login
  gcloud auth application-default set-quota-project ${projectId}

On Cloud Run / Cloud Build / GCE / GKE, attach a service account to the
resource instead. In GitHub Actions, use Workload Identity Federation.
`;

// The Google auth libraries resolve credentials lazily and can surface the
// failure as an unhandled rejection rather than through the await, so keep a
// backstop that turns that into the same readable message.
process.on('unhandledRejection', (error) => {
  const message = String(error?.message ?? error);
  console.error(/default credentials/i.test(message) ? signInHelp : `\n✗ ${message}\n`);
  process.exit(1);
});

if (useEmulator) {
  // The emulator ignores credentials entirely, so don't resolve any.
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  initializeApp({ projectId });
  console.log(`Seeding the emulator at ${process.env.FIRESTORE_EMULATOR_HOST} (project ${projectId})`);
} else {
  const credential = applicationDefault();
  // Resolve a token now so a missing sign-in fails immediately and clearly,
  // instead of surfacing later as a gRPC stack trace.
  try {
    await credential.getAccessToken();
  } catch (error) {
    console.error(signInHelp);
    console.error(`Underlying error: ${error.message}\n`);
    process.exit(1);
  }
  initializeApp({ credential, projectId });
  console.log(`Seeding project ${projectId} using Application Default Credentials`);
}

const db = getFirestore();

let created = 0;
let updated = 0;

try {
  // Firestore batches cap at 500 writes; 60 fits comfortably in one.
  const batch = db.batch();
  const existing = await db.collection('washrooms').get();
  const existingIds = new Set(existing.docs.map((d) => d.id));

  for (const w of WASHROOMS) {
    const ref = db.collection('washrooms').doc(w.id);
    const descriptive = {
      name: w.name,
      type: w.type,
      area: w.neighbourhood,
      lat: w.lat,
      lng: w.lng,
      fee: w.fee,
      needsKey: w.needsKey,
      wheelchair: w.wheelchair,
      babyChange: w.babyChange,
      genderNeutral: w.genderNeutral,
      openFrom: w.openFrom,
      openTo: w.openTo,
      status: 'published',
    };

    if (existingIds.has(w.id)) {
      // merge:true leaves reviewCount / ratingSum / cleanVotes untouched
      batch.set(ref, descriptive, { merge: true });
      updated++;
    } else {
      batch.set(ref, {
        ...descriptive,
        reviewCount: 0,
        ratingSum: 0,
        cleanVotes: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
      created++;
    }
  }

  await batch.commit();
} catch (error) {
  const message = String(error?.message ?? error);
  const isAuth = /credential|authenticat|permission|PERMISSION_DENIED|UNAUTHENTICATED|quota project/i.test(message);
  console.error(`\n✗ Seeding failed: ${message}\n`);
  if (isAuth) {
    console.error(`This looks like a credentials problem. Check that:

  1. You are signed in:
       gcloud auth application-default login
       gcloud auth application-default set-quota-project ${projectId}

  2. The signed-in account can write to Firestore in ${projectId}
     (roles/datastore.user is enough; Owner/Editor also work).

  3. You are pointed at the right project:
       gcloud config get-value project
`);
  }
  process.exit(1);
}

console.log(`\n✓ ${created} washroom${created === 1 ? '' : 's'} created, ${updated} updated.`);
console.log('  No ratings or reviews were added — those only come from real people.\n');
process.exit(0);
