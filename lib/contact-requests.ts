/* ------------------------------------------------------------------ *
 * Demandes de contact (formulaire du site) — Firestore `contact_requests`.
 *
 * Chaque demande est enregistrée AVANT l'envoi des courriels : même si
 * SendGrid échoue ou que le courriel se perd dans la boîte de réception, la
 * demande reste dans la zone admin (/admin/demandes).
 *
 * « Vue » (seenAt) et le statut de suivi sont distincts : la bulle de
 * notification compte les demandes jamais ouvertes ; le statut dit si on a
 * fait le suivi (contactée, devenue cliente, sans suite).
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";

export type ContactStatus = "nouvelle" | "contactee" | "client" | "sans_suite";
export const CONTACT_STATUSES: ContactStatus[] = ["nouvelle", "contactee", "client", "sans_suite"];

export type ContactRequest = {
  id: string;
  nom: string;
  courriel: string;
  tel: string;
  parc: string;
  service: string;
  message: string;
  createdAt: string; // ISO
  status: ContactStatus;
  seenAt: string | null;
  seenBy: string | null;
  /** Notes de suivi internes (jamais envoyées au prospect). */
  followUp: string;
  /** Courriels envoyés avec succès (accusé au prospect, avis à l'équipe). */
  emailOk: boolean;
};

const col = () => adminDb().collection("contact_requests");

export async function addContactRequest(input: {
  nom: string;
  courriel: string;
  tel: string;
  parc: string;
  service: string;
  message: string;
}): Promise<string | null> {
  if (!adminConfigured()) return null;
  const ref = col().doc();
  await ref.set({
    ...input,
    createdAt: new Date().toISOString(),
    status: "nouvelle",
    seenAt: null,
    seenBy: null,
    followUp: "",
    emailOk: null,
    serverCreatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function setContactEmailOk(id: string, ok: boolean): Promise<void> {
  await col().doc(id).set({ emailOk: ok }, { merge: true });
}

export async function listContactRequests(): Promise<ContactRequest[]> {
  if (!adminConfigured()) return [];
  const snap = await col().get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      const status = CONTACT_STATUSES.includes(x.status) ? (x.status as ContactStatus) : "nouvelle";
      return {
        id: d.id,
        nom: String(x.nom ?? ""),
        courriel: String(x.courriel ?? ""),
        tel: String(x.tel ?? ""),
        parc: String(x.parc ?? ""),
        service: String(x.service ?? ""),
        message: String(x.message ?? ""),
        createdAt: String(x.createdAt ?? ""),
        status,
        seenAt: typeof x.seenAt === "string" ? x.seenAt : null,
        seenBy: typeof x.seenBy === "string" ? x.seenBy : null,
        followUp: String(x.followUp ?? ""),
        emailOk: x.emailOk !== false,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Nombre de demandes jamais ouvertes (bulle de notification). */
export async function unseenContactCount(): Promise<number> {
  if (!adminConfigured()) return 0;
  const snap = await col().where("seenAt", "==", null).get();
  return snap.size;
}

export async function updateContactRequest(
  id: string,
  patch: { seenBy?: string; status?: ContactStatus; followUp?: string }
): Promise<void> {
  const ref = col().doc(id);
  const update: Record<string, unknown> = {};
  if (patch.seenBy) {
    // Première ouverture seulement (on garde qui l'a vue en premier, et quand).
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Demande introuvable.");
    if (!snap.get("seenAt")) {
      update.seenAt = new Date().toISOString();
      update.seenBy = patch.seenBy;
    }
  }
  if (patch.status) update.status = patch.status;
  if (patch.followUp !== undefined) update.followUp = patch.followUp.slice(0, 5000);
  if (Object.keys(update).length) await ref.set(update, { merge: true });
}

/** Suppression définitive (ex. demande d'un prospect en vertu de la Loi 25, ou pourriel). */
export async function deleteContactRequest(id: string): Promise<void> {
  await col().doc(id).delete();
}
