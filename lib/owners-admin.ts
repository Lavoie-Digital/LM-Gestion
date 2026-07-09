/* ------------------------------------------------------------------ *
 * Gestion des propriétaires côté SERVEUR (Admin SDK).
 *
 * Source de vérité du lien courriel ↔ sous-compte PlexFlow. Utilisé par les
 * routes admin (association) et par le contrôle d'accès (un courriel présent
 * ici = client autorisé, cf. [lib/access] + /api/access).
 *
 * Passer par l'Admin SDK (et non le SDK client) contourne le bloqueur de pub
 * et les règles Firestore, et garde les données côté serveur.
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";

export type OwnerRecord = {
  id: string;
  name: string;
  email: string;
  plexflowSubaccount: string | null;
};

export async function listOwners(): Promise<OwnerRecord[]> {
  if (!adminConfigured()) return [];
  const snap = await adminDb().collection("owners").get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      name: typeof x.name === "string" ? x.name : "",
      email: typeof x.email === "string" ? x.email : "",
      plexflowSubaccount: typeof x.plexflowSubaccount === "string" ? x.plexflowSubaccount : null,
    };
  });
}

/** Sous-comptes PlexFlow (noms) liés au courriel donné. */
export async function subaccountsForOwnerEmail(email: string): Promise<string[]> {
  if (!adminConfigured()) return [];
  const snap = await adminDb()
    .collection("owners")
    .where("email", "==", email.toLowerCase())
    .limit(10)
    .get();
  const names = new Set<string>();
  for (const doc of snap.docs) {
    const v = doc.get("plexflowSubaccount");
    if (typeof v === "string" && v.trim()) names.add(v.trim());
    if (Array.isArray(v)) for (const s of v) if (typeof s === "string" && s.trim()) names.add(s.trim());
  }
  return [...names];
}

/** Vrai si ce courriel correspond à un profil client (donc autorisé à se connecter). */
export async function isOwnerEmail(email: string): Promise<boolean> {
  if (!adminConfigured()) return false;
  const snap = await adminDb()
    .collection("owners")
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();
  return !snap.empty;
}

/** Associe (ou met à jour) un courriel à un sous-compte PlexFlow. Idempotent par sous-compte. */
export async function linkSubaccount(subaccount: string, email: string): Promise<void> {
  const db = adminDb();
  const sa = subaccount.trim();
  const mail = email.trim().toLowerCase();
  const existing = await db.collection("owners").where("plexflowSubaccount", "==", sa).limit(1).get();
  if (!existing.empty) {
    await existing.docs[0].ref.set(
      { email: mail, name: sa, plexflowSubaccount: sa, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return;
  }
  await db.collection("owners").add({
    name: sa,
    email: mail,
    plexflowSubaccount: sa,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Retire l'association d'un sous-compte (supprime le profil). */
export async function unlinkSubaccount(subaccount: string): Promise<void> {
  const db = adminDb();
  const snap = await db.collection("owners").where("plexflowSubaccount", "==", subaccount.trim()).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
