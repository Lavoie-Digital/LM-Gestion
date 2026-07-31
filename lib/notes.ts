/* ------------------------------------------------------------------ *
 * Notes clients — messages texte écrits par la gestionnaire (depuis /admin)
 * pour un sous-compte, affichés dans le tableau de bord du client.
 * Firestore `notes`. Tout passe par le serveur (Admin SDK).
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";

export type NoteFrom = "manager" | "client";
export type NoteStatus = "sent" | "scheduled";

export type NoteMeta = {
  id: string;
  subaccount: string;
  title: string;
  body: string;
  from: NoteFrom;
  author?: string;
  status: NoteStatus;
  scheduledFor?: string | null; // ISO — si programmé
  parentId?: string | null; // null = début d'un fil (sujet) ; sinon = réponse
  createdAt: string; // ISO
};

export async function addNote(input: {
  subaccount: string;
  title: string;
  body: string;
  from: NoteFrom;
  author?: string;
  scheduledFor?: string | null;
  parentId?: string | null;
}): Promise<NoteMeta> {
  const db = adminDb();
  const ref = db.collection("notes").doc();
  const createdAt = new Date().toISOString();
  // Programmé seulement si la date est dans le futur.
  const scheduledFor = input.scheduledFor && input.scheduledFor > createdAt ? input.scheduledFor : null;
  const status: NoteStatus = scheduledFor ? "scheduled" : "sent";
  const parentId = input.parentId?.trim() || null;
  const note = {
    subaccount: input.subaccount.trim(),
    title: input.title.trim(),
    body: input.body.trim(),
    from: input.from,
    author: input.author ?? null,
    status,
    scheduledFor,
    parentId,
    sentAt: scheduledFor ? null : createdAt,
    // Non lue côté gestionnaire uniquement pour une note DU CLIENT déjà envoyée.
    read: input.from !== "client",
    createdAt,
  };
  await ref.set({ ...note, serverCreatedAt: FieldValue.serverTimestamp() });
  return { id: ref.id, subaccount: note.subaccount, title: note.title, body: note.body, from: note.from, author: input.author, status, scheduledFor, parentId, createdAt };
}

/** Libère les notes programmées échues (statut → envoyé). Exactly-once via transaction.
 *  Renvoie les notes libérées (pour l'envoi courriel). */
export async function releaseDueNotes(): Promise<NoteMeta[]> {
  if (!adminConfigured()) return [];
  const db = adminDb();
  const nowIso = new Date().toISOString();
  const snap = await db.collection("notes").where("status", "==", "scheduled").get();
  const due = snap.docs.filter((d) => String(d.get("scheduledFor") ?? "") <= nowIso);
  const released: NoteMeta[] = [];
  for (const d of due) {
    const data = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(d.ref);
      if (fresh.get("status") !== "scheduled") return null; // déjà libérée par un autre appel
      tx.update(d.ref, { status: "sent", sentAt: nowIso });
      return fresh.data();
    });
    if (data) {
      released.push({
        id: d.id,
        subaccount: String(data.subaccount ?? ""),
        title: String(data.title ?? ""),
        body: String(data.body ?? ""),
        from: data.from === "client" ? "client" : "manager",
        author: typeof data.author === "string" ? data.author : undefined,
        status: "sent",
        scheduledFor: null,
        createdAt: String(data.createdAt ?? ""),
      });
    }
  }
  return released;
}

/** Compte les notes clients non lues, par sous-compte. */
export async function unreadCountsBySubaccount(): Promise<Record<string, number>> {
  if (!adminConfigured()) return {};
  const snap = await adminDb().collection("notes").where("from", "==", "client").get();
  const counts: Record<string, number> = {};
  for (const d of snap.docs) {
    if (d.get("read") === true) continue; // lu (ou legacy sans champ → considéré non lu)
    const sa = String(d.get("subaccount") ?? "");
    if (sa) counts[sa] = (counts[sa] ?? 0) + 1;
  }
  return counts;
}

/** Marque comme lues toutes les notes clients d'un sous-compte. */
export async function markNotesRead(subaccount: string): Promise<void> {
  if (!adminConfigured()) return;
  const snap = await adminDb()
    .collection("notes")
    .where("subaccount", "==", subaccount.trim())
    .where("from", "==", "client")
    .get();
  const batch = adminDb().batch();
  let n = 0;
  for (const d of snap.docs) {
    if (d.get("read") !== true) {
      batch.update(d.ref, { read: true });
      n++;
    }
  }
  if (n) await batch.commit();
}

export async function listNotes(
  subaccounts: string[] | null,
  opts?: { onlySent?: boolean }
): Promise<NoteMeta[]> {
  if (!adminConfigured()) return [];
  const db = adminDb();
  let docs;
  if (subaccounts === null) {
    docs = (await db.collection("notes").get()).docs;
  } else if (subaccounts.length === 0) {
    return [];
  } else {
    docs = (await db.collection("notes").where("subaccount", "in", subaccounts.slice(0, 30)).get()).docs;
  }
  return docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        subaccount: String(x.subaccount ?? ""),
        title: String(x.title ?? ""),
        body: String(x.body ?? ""),
        from: x.from === "client" ? "client" : "manager",
        author: typeof x.author === "string" ? x.author : undefined,
        status: x.status === "scheduled" ? "scheduled" : "sent",
        scheduledFor: typeof x.scheduledFor === "string" ? x.scheduledFor : null,
        parentId: typeof x.parentId === "string" ? x.parentId : null,
        createdAt: String(x.createdAt ?? ""),
      } satisfies NoteMeta;
    })
    // Le client ne voit jamais les notes programmées (non encore envoyées).
    .filter((n) => (opts?.onlySent ? n.status === "sent" : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteNote(id: string): Promise<void> {
  await adminDb().collection("notes").doc(id).delete();
}
