/* ------------------------------------------------------------------ *
 * Notes clients — messages texte écrits par la gestionnaire (depuis /admin)
 * pour un sous-compte, affichés dans le tableau de bord du client.
 * Firestore `notes`. Tout passe par le serveur (Admin SDK).
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminBucket, adminConfigured, adminDb } from "./firebase-admin";

export type NoteFrom = "manager" | "client";
export type NoteStatus = "sent" | "scheduled";

/** Pièce jointe stockée (métadonnées ; url signée générée à la lecture). */
export type NoteAttachmentStored = { name: string; storagePath: string; contentType: string; size: number };
export type NoteAttachment = { name: string; contentType: string; size: number; url?: string };

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
  attachments?: NoteAttachment[];
  createdAt: string; // ISO
};

function safeName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "fichier";
}

/** Extrait les fichiers d'un FormData (champ `files`), en ignorant les vides / trop gros (>15 Mo). */
export async function readNoteFiles(form: FormData, field = "files"): Promise<{ name: string; contentType: string; buffer: Buffer }[]> {
  const out: { name: string; contentType: string; buffer: Buffer }[] = [];
  for (const f of form.getAll(field)) {
    if (f instanceof File && f.size > 0 && f.size <= 15 * 1024 * 1024) {
      out.push({ name: f.name || "fichier", contentType: f.type || "application/octet-stream", buffer: Buffer.from(await f.arrayBuffer()) });
    }
  }
  return out;
}

/** Téléverse des pièces jointes dans une note (Storage) + met à jour le doc. */
export async function attachFilesToNote(
  noteId: string,
  files: { name: string; contentType: string; buffer: Buffer }[]
): Promise<void> {
  if (!files.length) return;
  const bucket = adminBucket();
  const metas: NoteAttachmentStored[] = [];
  for (const f of files) {
    const path = `note-attachments/${noteId}/${Date.now()}-${safeName(f.name)}`;
    await bucket.file(path).save(f.buffer, {
      resumable: false,
      contentType: f.contentType || "application/octet-stream",
      metadata: { contentType: f.contentType || "application/octet-stream" },
    });
    metas.push({ name: f.name, storagePath: path, contentType: f.contentType || "application/octet-stream", size: f.buffer.length });
  }
  await adminDb().collection("notes").doc(noteId).set({ attachments: FieldValue.arrayUnion(...metas) }, { merge: true });
}

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
  const mapped = await Promise.all(
    docs.map(async (d) => {
      const x = d.data();
      // Pièces jointes → URL signées temporaires (15 min).
      const rawAtt = Array.isArray(x.attachments) ? (x.attachments as NoteAttachmentStored[]) : [];
      const attachments: NoteAttachment[] = await Promise.all(
        rawAtt.map(async (a) => {
          let url: string | undefined;
          try {
            const [signed] = await adminBucket().file(a.storagePath).getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
            url = signed;
          } catch {
            url = undefined;
          }
          return { name: a.name, contentType: a.contentType, size: a.size, url };
        })
      );
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
        attachments,
        createdAt: String(x.createdAt ?? ""),
      } satisfies NoteMeta;
    })
  );
  return mapped
    // Le client ne voit jamais les notes programmées (non encore envoyées).
    .filter((n) => (opts?.onlySent ? n.status === "sent" : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteNote(id: string): Promise<void> {
  const ref = adminDb().collection("notes").doc(id);
  const snap = await ref.get();
  const atts = snap.exists && Array.isArray(snap.get("attachments")) ? (snap.get("attachments") as NoteAttachmentStored[]) : [];
  for (const a of atts) {
    if (a.storagePath) await adminBucket().file(a.storagePath).delete().catch(() => {});
  }
  await ref.delete();
}
