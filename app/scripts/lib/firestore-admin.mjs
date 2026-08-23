// Shared Firestore setup for the admin scripts. Authentication is Application
// Default Credentials — there are no service account key files in this repo.
// ADC resolves your gcloud login locally, the attached service account on
// Google Cloud, and Workload Identity Federation in CI.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';

const envFileValue = (key) => {
  try {
    const line = fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith(`${key}=`));
    return line?.slice(line.indexOf('=') + 1).trim() || null;
  } catch {
    return null;
  }
};

export const resolveProjectId = (argv) => {
  const flag = argv.find((a) => a.startsWith('--project='))?.split('=')[1];
  const useEmulator = argv.includes('--emulator');
  return flag
    ?? process.env.GOOGLE_CLOUD_PROJECT
    ?? process.env.FIREBASE_PROJECT_ID
    ?? envFileValue('VITE_FIREBASE_PROJECT_ID')
    ?? (useEmulator ? 'demo-loo' : null);
};

const signInHelp = (projectId) => `
No Application Default Credentials found.

Sign in once on this machine, then re-run:

  gcloud auth application-default login
  gcloud auth application-default set-quota-project ${projectId}

On Cloud Run / Cloud Build / GCE / GKE, attach a service account to the
resource instead. In GitHub Actions, use Workload Identity Federation.
`;

export const connect = async ({ projectId, useEmulator }) => {
  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
    initializeApp({ projectId });
    console.log(`Using the emulator at ${process.env.FIRESTORE_EMULATOR_HOST} (project ${projectId})`);
    return getFirestore();
  }

  const credential = applicationDefault();
  // Resolve a token now so a missing sign-in fails immediately and clearly,
  // rather than surfacing later as a gRPC stack trace.
  try {
    await credential.getAccessToken();
  } catch (error) {
    console.error(signInHelp(projectId));
    console.error(`Underlying error: ${error.message}\n`);
    process.exit(1);
  }
  initializeApp({ credential, projectId });
  console.log(`Using project ${projectId} via Application Default Credentials`);
  return getFirestore();
};

// Firestore caps a batch at 500 writes.
export const BATCH_LIMIT = 500;

export const commitInBatches = async (db, items, apply) => {
  let written = 0;
  for (let i = 0; i < items.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const item of items.slice(i, i + BATCH_LIMIT)) apply(batch, item);
    await batch.commit();
    written += Math.min(BATCH_LIMIT, items.length - i);
    process.stdout.write(`\r  written ${written}/${items.length}`);
  }
  if (items.length) process.stdout.write('\n');
  return written;
};
