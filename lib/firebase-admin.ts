/* ------------------------------------------------------------------ *
 * Firebase Admin SDK — accès serveur.
 *
 * Deux niveaux, volontairement découplés :
 *  - VÉRIFICATION DE JETON (adminAuth) : ne requiert QUE le projectId (public).
 *    verifyIdToken valide la signature via les clés publiques de Google + le
 *    projectId — aucun compte de service nécessaire. → marche tout de suite.
 *  - FIRESTORE (adminDb) : requiert le compte de service (FIREBASE_SERVICE_ACCOUNT),
 *    car les lectures/écritures privilégiées sont authentifiées.
 *
 * La clé du compte de service est un SECRET serveur — jamais exposée au client.
 * Console Firebase → Paramètres du projet → Comptes de service → Générer une clé.
 * ------------------------------------------------------------------ */

import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function loadServiceAccount(): (ServiceAccount & { project_id?: string }) | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Vrai si le compte de service serveur est configuré (requis pour Firestore). */
export function adminConfigured(): boolean {
  return loadServiceAccount() !== null;
}

/** Vrai si la vérification de jeton est possible (projectId présent). */
export function authConfigured(): boolean {
  return Boolean(PROJECT_ID || loadServiceAccount());
}

function getNamedApp(name: string, withCredential: boolean): App {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;
  const svc = loadServiceAccount();
  if (withCredential) {
    if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT manquant/invalide (requis pour Firestore).");
    return initializeApp({ credential: cert(svc), projectId: svc.project_id ?? PROJECT_ID }, name);
  }
  // App légère pour la vérification de jeton : credential si dispo, sinon projectId seul.
  return initializeApp(
    svc ? { credential: cert(svc), projectId: svc.project_id ?? PROJECT_ID } : { projectId: PROJECT_ID },
    name
  );
}

/** Auth serveur (vérification des jetons ID clients). Pas besoin du compte de service. */
export function adminAuth(): Auth {
  return getAuth(getNamedApp("lm-auth", false));
}

/** Firestore serveur (droits admin). Requiert le compte de service. */
export function adminDb(): Firestore {
  return getFirestore(getNamedApp("lm-db", true));
}
