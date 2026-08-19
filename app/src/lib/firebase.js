import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

// With no config the app still runs, in a clearly-labelled local demo mode,
// so it never hard-crashes on a fresh clone or a preview build.
export const isConfigured = Boolean(config.apiKey && config.projectId);

// Point at the local emulator instead of the real project.
const useEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true';

let app = null;
let auth = null;
let firestore = null;

if (isConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
  firestore = getFirestore(app);

  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }
}

export { app, auth, firestore };

// Everyone gets an anonymous Firebase account on first visit — no signup, but
// a real server-verified uid, which is what lets the security rules enforce
// "you can only edit your own review".
let sessionPromise = null;

export const ensureSession = () => {
  if (!auth) return Promise.resolve(null);
  sessionPromise ??= new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(auth, (user) => {
      if (user) { stop(); resolve(user); }
    }, reject);

    signInAnonymously(auth).catch((error) => {
      stop();
      sessionPromise = null;
      reject(new Error(
        error?.code === 'auth/admin-restricted-operation' || error?.code === 'auth/operation-not-allowed'
          ? 'Anonymous sign-in is turned off for this Firebase project. Turn it on: '
            + 'Firebase console → Authentication → Sign-in method → Anonymous → Enable.'
          : `Could not start a session: ${error?.message ?? error}`,
      ));
    });
  });
  return sessionPromise;
};

export const currentUserId = async () => (await ensureSession())?.uid ?? null;
