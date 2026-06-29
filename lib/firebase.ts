import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/* ------------------------------------------------------------------ *
 * Initialisation Firebase (côté client uniquement).
 *
 * La config web Firebase (apiKey, etc.) est PUBLIQUE par conception — ce ne
 * sont pas des secrets. La sécurité réelle vient des « domaines autorisés »
 * dans la console Firebase et des règles Firestore. C'est pourquoi ces valeurs
 * sont en NEXT_PUBLIC_*.
 * ------------------------------------------------------------------ */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(config);
}

/** Instance Auth (initialise l'app au premier appel, navigateur). */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/** Instance Firestore (stockage : profils clients, immeubles, instantanés…). */
export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();
