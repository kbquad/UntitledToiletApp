import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
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

// reCAPTCHA v3, carried by App Check. The site key is public — it is the half
// that belongs in the browser; the secret half lives in the Firebase console,
// which is what lets Google verify the token on its side.
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Enforcement is a console setting, so this can be shipped before it is turned
// on: unenforced, tokens are collected and reported but nothing is rejected.
export const isProtected = Boolean(isConfigured && recaptchaSiteKey && !useEmulator);

let app = null;
let auth = null;
let firestore = null;
let appCheck = null;

if (isConfigured) {
  app = initializeApp(config);

  // Before initializeAppCheck, or the debug token is ignored. In a dev build
  // this prints a token to the console; register it under App Check → Manage
  // debug tokens and localhost can talk to a project with enforcement on.
  if (import.meta.env.DEV && recaptchaSiteKey) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  // Skipped against the emulator, which does not check tokens, and skipped
  // with no key so a fresh clone still runs.
  if (isProtected) {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      // Refresh in the background, so a token is ready when someone posts
      // rather than being fetched at the moment they hit the button.
      isTokenAutoRefreshEnabled: true,
    });
  }

  auth = getAuth(app);
  firestore = getFirestore(app);

  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }
}

export { app, auth, firestore, appCheck };

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
