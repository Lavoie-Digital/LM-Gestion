/* ------------------------------------------------------------------ *
 * Clients (sous-comptes) ajoutés MANUELLEMENT — pour afficher des clients
 * qui n'ont pas (encore) d'unité dans PlexFlow (l'API ne liste que les unités).
 * Collection Firestore : `manual_subaccounts` { name }.
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";

export async function listManualSubaccounts(): Promise<string[]> {
  if (!adminConfigured()) return [];
  const snap = await adminDb().collection("manual_subaccounts").get();
  return snap.docs.map((d) => String(d.get("name") ?? "")).filter(Boolean);
}

export async function addManualSubaccount(name: string): Promise<void> {
  const n = name.trim();
  if (!n) return;
  const dup = await adminDb().collection("manual_subaccounts").where("name", "==", n).limit(1).get();
  if (!dup.empty) return;
  await adminDb().collection("manual_subaccounts").add({ name: n, createdAt: FieldValue.serverTimestamp() });
}

export async function removeManualSubaccount(name: string): Promise<void> {
  const snap = await adminDb().collection("manual_subaccounts").where("name", "==", name.trim()).get();
  const batch = adminDb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (snap.size) await batch.commit();
}
