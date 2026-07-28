/* ------------------------------------------------------------------ *
 * Assignation d'un GESTIONNAIRE (compte admin) à un sous-compte client.
 * Sert à router les notifications du client (ex. notes) vers le bon
 * gestionnaire plutôt que vers tous les admins.
 * Collection Firestore : `sub_managers` { subaccount, manager }.
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";

/** Gestionnaire assigné à un sous-compte (courriel), ou null. */
export async function getManager(subaccount: string): Promise<string | null> {
  if (!adminConfigured()) return null;
  const snap = await adminDb()
    .collection("sub_managers")
    .where("subaccount", "==", subaccount.trim())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const m = snap.docs[0].get("manager");
  return typeof m === "string" && m ? m : null;
}

/** Tous les sous-comptes assignés → { subaccount: managerEmail }. */
export async function listManagers(): Promise<Record<string, string>> {
  if (!adminConfigured()) return {};
  const snap = await adminDb().collection("sub_managers").get();
  const map: Record<string, string> = {};
  for (const d of snap.docs) {
    const sa = d.get("subaccount");
    const m = d.get("manager");
    if (typeof sa === "string" && typeof m === "string" && sa && m) map[sa] = m;
  }
  return map;
}

/** Assigne (ou retire si manager vide) un gestionnaire à un sous-compte. */
export async function setManager(subaccount: string, manager: string | null): Promise<void> {
  const db = adminDb();
  const sa = subaccount.trim();
  const existing = await db.collection("sub_managers").where("subaccount", "==", sa).get();

  if (!manager) {
    const batch = db.batch();
    existing.docs.forEach((d) => batch.delete(d.ref));
    if (existing.size) await batch.commit();
    return;
  }

  const m = manager.trim().toLowerCase();
  if (!existing.empty) {
    await existing.docs[0].ref.set({ subaccount: sa, manager: m, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } else {
    await db.collection("sub_managers").add({ subaccount: sa, manager: m, createdAt: FieldValue.serverTimestamp() });
  }
}
