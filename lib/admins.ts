/* ------------------------------------------------------------------ *
 * Administrateurs additionnels (stockés dans Firestore `admins`).
 *
 * Les admins « permanents » viennent de NEXT_PUBLIC_ADMIN_EMAILS (cf. lib/access).
 * Ici on gère ceux ajoutés depuis la zone admin, en plus. Un admin (env OU base)
 * a accès à /admin et au tableau de bord complet.
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";

export async function isDbAdmin(email: string): Promise<boolean> {
  if (!adminConfigured()) return false;
  const snap = await adminDb().collection("admins").where("email", "==", email.toLowerCase()).limit(1).get();
  return !snap.empty;
}

export async function listDbAdmins(): Promise<{ id: string; email: string }[]> {
  if (!adminConfigured()) return [];
  const snap = await adminDb().collection("admins").get();
  return snap.docs
    .map((d) => ({ id: d.id, email: String(d.get("email") ?? "") }))
    .filter((a) => a.email);
}

/** Ajoute un admin. Renvoie true si NOUVEL ajout (false s'il existait déjà). */
export async function addDbAdmin(email: string): Promise<boolean> {
  const mail = email.trim().toLowerCase();
  const existing = await adminDb().collection("admins").where("email", "==", mail).limit(1).get();
  if (!existing.empty) return false;
  await adminDb().collection("admins").add({ email: mail, createdAt: FieldValue.serverTimestamp() });
  return true;
}

export async function removeDbAdmin(email: string): Promise<void> {
  const mail = email.trim().toLowerCase();
  const snap = await adminDb().collection("admins").where("email", "==", mail).get();
  const batch = adminDb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
