import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/** Default config preserves behavior when env vars are not set (public client keys). */
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyDPrLJJhY9CuS62vpFhapv9h8tc-tvQYdo",
  authDomain: "swiftlinkpro-ec095.firebaseapp.com",
  projectId: "swiftlinkpro-ec095",
  storageBucket: "swiftlinkpro-ec095.firebasestorage.app",
  messagingSenderId: "61599826268",
  appId: "1:61599826268:web:0bc90a879adc947a80c199",
};

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FALLBACK_CONFIG.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      FALLBACK_CONFIG.authDomain,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FALLBACK_CONFIG.projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      FALLBACK_CONFIG.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      FALLBACK_CONFIG.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FALLBACK_CONFIG.appId,
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebase() {
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null };
  }
  if (!app) {
    const cfg = getFirebaseConfig();
    app = getApps().length ? getApps()[0]! : initializeApp(cfg);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}
