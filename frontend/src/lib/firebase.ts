/**
 * Firebase is loaded only on the client via dynamic imports to avoid
 * "window is not defined" or other server-side errors during dev/build.
 * All "firebase/*" imports are in this file so webpack alias in next.config applies.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let appInstance: unknown = null;
let authInstance: unknown = null;
let analyticsInstance: unknown = null;
let firestoreInstance: unknown = null;

async function getFirebaseApp(): Promise<unknown> {
  if (typeof window === "undefined") return null;
  if (appInstance) return appInstance;
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId
  ) {
    return null;
  }
  const { initializeApp, getApps } = await import("firebase/app");
  if (getApps().length > 0) {
    appInstance = getApps()[0];
    return appInstance;
  }
  appInstance = initializeApp(firebaseConfig);
  return appInstance;
}

export async function getFirebaseAuth(): Promise<import("firebase/auth").Auth | null> {
  if (typeof window === "undefined") return null;
  const app = await getFirebaseApp();
  if (!app) return null;
  if (!authInstance) {
    const { getAuth } = await import("firebase/auth");
    authInstance = getAuth(app as import("firebase/app").FirebaseApp);
  }
  return authInstance as import("firebase/auth").Auth;
}

/**
 * Runs Google sign-in popup and returns the Google ID token
 * from the OAuth credential. Only call from the client.
 */
export async function signInWithGooglePopup(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const auth = await getFirebaseAuth();
  if (!auth) return null;
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const idToken = credential?.idToken ?? null;
  return idToken;
}

export async function getFirebaseAnalytics(): Promise<unknown> {
  if (typeof window === "undefined") return null;
  const app = await getFirebaseApp();
  if (!app) return null;
  if (!analyticsInstance) {
    const { getAnalytics } = await import("firebase/analytics");
    analyticsInstance = getAnalytics(app as import("firebase/app").FirebaseApp);
  }
  return analyticsInstance;
}

/**
 * Returns Firestore instance for the default app. Only call from the client.
 * Enable Firestore in [Firebase Console](https://console.firebase.google.com/project/cooking-66acb/firestore) if needed.
 */
export async function getFirestore(): Promise<import("firebase/firestore").Firestore | null> {
  if (typeof window === "undefined") return null;
  const app = await getFirebaseApp();
  if (!app) return null;
  if (!firestoreInstance) {
    const { getFirestore: getFs } = await import("firebase/firestore");
    firestoreInstance = getFs(app as import("firebase/app").FirebaseApp);
  }
  return firestoreInstance as import("firebase/firestore").Firestore;
}
