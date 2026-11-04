/* ------------------------------------------------------------------ *
 * Notes clients — fils de discussion gestionnaire ↔ client, gérés depuis la
 * boîte de réception /admin/notes et affichés dans le tableau de bord client.
 * Firestore `notes`. Tout passe par le serveur (Admin SDK).
 *
 * Un FIL = une note racine (parentId null) + ses réponses. L'état du fil est
 * porté par la racine :
 *   threadStatus : "open" (à traiter) | "waiting" (en attente du client) | "resolved" (réglé)
 *   assignedTo   : courriel de l'employé (admin) responsable du fil
 *   lastActivityAt / lastFrom : tri et aperçu dans la boîte de réception
 *
 * « Lu » (read) et « réglé » sont volontairement distincts : ouvrir un fil le
 * marque lu, mais il reste « à traiter » tant qu'on ne l'a pas réglé.
 *
 * Notes INTERNES (internal) : visibles des admins seulement — jamais renvoyées
 * au client, jamais envoyées par courriel au client.
 * ------------------------------------------------------------------ */

import { FieldValue, type DocumentData, type DocumentSnapshot } from "firebase-admin/firestore";
import { adminBucket, adminConfigured, adminDb } from "./firebase-admin";
import { cached, cacheInvalidate } from "./cache";

export type NoteFrom = "manager" | "client";
export type NoteStatus = "sent" | "scheduled";
export type ThreadStatus = "open" | "waiting" | "resolved";

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
  /** Note interne (admins seulement). */
  internal?: boolean;
  /** Note du client : lue par l'équipe. */
  read?: boolean;
  /** Note du gestionnaire : première consultation par le client. */
  seenByClientAt?: string | null;
  /** Note du gestionnaire : courriels de notification réellement envoyés. */
  emailedTo?: string[];
  emailedAt?: string | null;
  /** Tentative de notification sans aucun envoi réussi (ex. aucun accès client). */
  emailAttemptedAt?: string | null;
  remindedAt?: string | null;
  // Champs de fil (racine seulement)
  threadStatus?: ThreadStatus;
  assignedTo?: string | null;
  lastActivityAt?: string;
};

export type ThreadSummary = {
  id: string; // id de la racine
  subaccount: string;
  title: string;
  status: ThreadStatus;
  assignedTo: string | null;
  internal: boolean;
  lastActivityAt: string;
  lastFrom: NoteFrom;
  unread: number; // notes du client non lues
  messages: NoteMeta[]; // racine + réponses, ordre chronologique
};

const notesCol = () => adminDb().collection("notes");

/**
 * La boîte de réception lit TOUTE la collection (≈ 2 s à froid). On garde le
 * résultat 15 s en mémoire ; toute écriture faite par ce serveur vide le cache,
 * donc l'équipe voit ses propres changements immédiatement. (Par instance — cf.
 * lib/cache.ts : au pire 15 s de décalage entre deux instances.)
 */
const ALL_NOTES_KEY = "notes:all";
const ALL_NOTES_TTL_MS = 15_000;
const invalidateNotes = () => cacheInvalidate("notes:");

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
  await notesCol().doc(noteId).set({ attachments: FieldValue.arrayUnion(...metas) }, { merge: true });
  invalidateNotes();
}

/**
 * Résout le fil visé par une réponse : la racine doit exister et appartenir au
 * MÊME sous-compte (empêche d'écrire dans le fil d'un autre client). Une
 * réponse à une réponse est rattachée à la racine.
 */
export async function resolveThreadRoot(
  parentId: string,
  subaccount: string
): Promise<{ id: string; internal: boolean; assignedTo: string | null; title: string } | null> {
  let snap = await notesCol().doc(parentId).get();
  if (!snap.exists) return null;
  const pid = snap.get("parentId");
  if (typeof pid === "string" && pid) {
    snap = await notesCol().doc(pid).get();
    if (!snap.exists) return null;
  }
  if (String(snap.get("subaccount") ?? "") !== subaccount.trim()) return null;
  return {
    id: snap.id,
    internal: snap.get("internal") === true,
    assignedTo: typeof snap.get("assignedTo") === "string" ? snap.get("assignedTo") : null,
    title: String(snap.get("title") ?? ""),
  };
}

export async function addNote(input: {
  subaccount: string;
  title: string;
  body: string;
  from: NoteFrom;
  author?: string;
  scheduledFor?: string | null;
  /** Doit être une racine déjà validée par resolveThreadRoot. */
  parentId?: string | null;
  internal?: boolean;
  /** Racine seulement : employé responsable du fil. */
  assignedTo?: string | null;
}): Promise<NoteMeta> {
  const db = adminDb();
  const ref = notesCol().doc();
  const createdAt = new Date().toISOString();
  const internal = input.from === "manager" && input.internal === true;
  // Programmé seulement si la date est dans le futur (jamais pour une note interne).
  const scheduledFor = !internal && input.scheduledFor && input.scheduledFor > createdAt ? input.scheduledFor : null;
  const status: NoteStatus = scheduledFor ? "scheduled" : "sent";
  const parentId = input.parentId?.trim() || null;
  const note: Record<string, unknown> = {
    subaccount: input.subaccount.trim(),
    title: input.title.trim(),
    body: input.body.trim(),
    from: input.from,
    author: input.author ?? null,
    status,
    scheduledFor,
    parentId,
    internal,
    sentAt: scheduledFor ? null : createdAt,
    // Non lue côté équipe uniquement pour une note DU CLIENT.
    read: input.from !== "client",
    createdAt,
  };
  // Le client « répond » → le fil redevient à traiter ; le gestionnaire répond
  // publiquement → en attente du client ; une note interne ne change rien.
  const nextStatus: ThreadStatus | null =
    input.from === "client" ? "open" : internal ? null : "waiting";

  if (!parentId) {
    note.threadStatus = nextStatus ?? "open"; // nouvelle tâche interne → à traiter
    note.assignedTo = input.assignedTo?.trim().toLowerCase() || null;
    note.lastActivityAt = createdAt;
    note.lastFrom = input.from;
    await ref.set({ ...note, serverCreatedAt: FieldValue.serverTimestamp() });
    invalidateNotes();
  } else {
    const rootUpdate: Record<string, unknown> = { lastActivityAt: createdAt, lastFrom: input.from };
    if (nextStatus) rootUpdate.threadStatus = nextStatus;
    const batch = db.batch();
    batch.set(ref, { ...note, serverCreatedAt: FieldValue.serverTimestamp() });
    batch.set(notesCol().doc(parentId), rootUpdate, { merge: true });
    await batch.commit();
    invalidateNotes();
  }

  return {
    id: ref.id,
    subaccount: String(note.subaccount),
    title: String(note.title),
    body: String(note.body),
    from: input.from,
    author: input.author,
    status,
    scheduledFor,
    parentId,
    internal,
    createdAt,
  };
}

/** Enregistre les courriels de notification effectivement envoyés pour une note. */
export async function recordEmailed(noteId: string, emails: string[], opts?: { reminder?: boolean }): Promise<void> {
  const now = new Date().toISOString();
  if (!emails.length) {
    await notesCol().doc(noteId).set({ emailAttemptedAt: now }, { merge: true });
    invalidateNotes();
    return;
  }
  await notesCol()
    .doc(noteId)
    .set(
      opts?.reminder
        ? { remindedAt: now, emailedTo: FieldValue.arrayUnion(...emails) }
        : { emailedAt: now, emailedTo: FieldValue.arrayUnion(...emails) },
      { merge: true }
    );
  invalidateNotes();
}

/** Libère les notes programmées échues (statut → envoyé). Exactly-once via transaction.
 *  Renvoie les notes libérées (pour l'envoi courriel). */
export async function releaseDueNotes(): Promise<NoteMeta[]> {
  if (!adminConfigured()) return [];
  const db = adminDb();
  const nowIso = new Date().toISOString();
  const snap = await notesCol().where("status", "==", "scheduled").get();
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
        parentId: typeof data.parentId === "string" ? data.parentId : null,
        internal: data.internal === true,
        createdAt: String(data.createdAt ?? ""),
      });
    }
  }
  if (released.length) invalidateNotes();
  return released;
}

/** Marque comme lues les notes du client d'un fil (ouverture dans la boîte de réception). */
export async function markThreadRead(rootId: string): Promise<void> {
  const [root, replies] = await Promise.all([
    notesCol().doc(rootId).get(),
    notesCol().where("parentId", "==", rootId).get(),
  ]);
  const batch = adminDb().batch();
  let n = 0;
  for (const d of [root, ...replies.docs]) {
    if (d.exists && d.get("from") === "client" && d.get("read") !== true) {
      batch.update(d.ref, { read: true });
      n++;
    }
  }
  if (n) {
    await batch.commit();
    invalidateNotes();
  }
}

/** Le client a consulté ses notes : horodate la 1re lecture des notes du gestionnaire. */
export async function markSeenByClient(subaccounts: string[]): Promise<void> {
  if (!adminConfigured() || subaccounts.length === 0) return;
  const snap = await notesCol().where("subaccount", "in", subaccounts.slice(0, 30)).get();
  const now = new Date().toISOString();
  const batch = adminDb().batch();
  let n = 0;
  for (const d of snap.docs) {
    if (d.get("from") !== "manager" || d.get("internal") === true) continue;
    if (d.get("status") !== "sent" || d.get("seenByClientAt")) continue;
    // Seulement les notes suivies (envoyées avec ce système) : une ancienne note
    // ne doit pas afficher une date de lecture inexacte.
    if (d.get("emailedTo") === undefined && !d.get("emailAttemptedAt")) continue;
    batch.update(d.ref, { seenByClientAt: now });
    n++;
  }
  if (n) {
    await batch.commit();
    invalidateNotes();
  }
}

/** Met à jour l'état d'un fil (statut et/ou employé assigné). */
export async function updateThread(
  rootId: string,
  patch: { status?: ThreadStatus; assignedTo?: string | null }
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.status) update.threadStatus = patch.status;
  if (patch.assignedTo !== undefined) update.assignedTo = patch.assignedTo?.trim().toLowerCase() || null;
  if (Object.keys(update).length) {
    await notesCol().doc(rootId).set(update, { merge: true });
    invalidateNotes();
  }
}

function mapNote(id: string, x: DocumentData, attachments: NoteAttachment[]): NoteMeta {
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    id,
    subaccount: String(x.subaccount ?? ""),
    title: String(x.title ?? ""),
    body: String(x.body ?? ""),
    from: x.from === "client" ? "client" : "manager",
    author: typeof x.author === "string" ? x.author : undefined,
    status: x.status === "scheduled" ? "scheduled" : "sent",
    scheduledFor: str(x.scheduledFor),
    parentId: str(x.parentId),
    attachments,
    createdAt: String(x.createdAt ?? ""),
    internal: x.internal === true,
    read: x.read === true,
    seenByClientAt: str(x.seenByClientAt),
    // undefined = note antérieure au suivi des courriels (rien à afficher).
    emailedTo: Array.isArray(x.emailedTo) ? x.emailedTo.filter((e: unknown) => typeof e === "string") : undefined,
    emailedAt: str(x.emailedAt),
    emailAttemptedAt: str(x.emailAttemptedAt),
    remindedAt: str(x.remindedAt),
    threadStatus: x.threadStatus === "open" || x.threadStatus === "waiting" || x.threadStatus === "resolved" ? x.threadStatus : undefined,
    assignedTo: str(x.assignedTo),
    lastActivityAt: str(x.lastActivityAt) ?? undefined,
  };
}

async function mapDocs(docs: DocumentSnapshot[], sign: boolean): Promise<NoteMeta[]> {
  return Promise.all(
    docs.map(async (d) => {
      const x = d.data() ?? {};
      // Pièces jointes → URL signées temporaires (15 min).
      const rawAtt = Array.isArray(x.attachments) ? (x.attachments as NoteAttachmentStored[]) : [];
      const attachments: NoteAttachment[] = await Promise.all(
        rawAtt.map(async (a) => {
          let url: string | undefined;
          if (sign) {
            try {
              const [signed] = await adminBucket().file(a.storagePath).getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
              url = signed;
            } catch {
              url = undefined;
            }
          }
          return { name: a.name, contentType: a.contentType, size: a.size, url };
        })
      );
      return mapNote(d.id, x, attachments);
    })
  );
}

export async function listNotes(
  subaccounts: string[] | null,
  opts?: { onlySent?: boolean; excludeInternal?: boolean; signUrls?: boolean }
): Promise<NoteMeta[]> {
  if (!adminConfigured()) return [];
  let mapped: NoteMeta[];
  if (subaccounts === null) {
    // URL signées valides 15 min ≫ durée du cache (15 s).
    mapped = await cached(ALL_NOTES_KEY, ALL_NOTES_TTL_MS, async () => mapDocs((await notesCol().get()).docs, true));
  } else if (subaccounts.length === 0) {
    return [];
  } else {
    const docs = (await notesCol().where("subaccount", "in", subaccounts.slice(0, 30)).get()).docs;
    mapped = await mapDocs(docs, opts?.signUrls !== false);
  }
  return mapped
    // Le client ne voit jamais les notes programmées (non encore envoyées)…
    .filter((n) => (opts?.onlySent ? n.status === "sent" : true))
    // …ni les notes internes de l'équipe.
    .filter((n) => (opts?.excludeInternal ? !n.internal : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Charge un seul fil (racine + réponses) — 2 petites requêtes au lieu de toute la collection. */
export async function getThread(rootId: string): Promise<ThreadSummary | null> {
  if (!adminConfigured()) return null;
  const [root, replies] = await Promise.all([
    notesCol().doc(rootId).get(),
    notesCol().where("parentId", "==", rootId).get(),
  ]);
  if (!root.exists || root.get("parentId")) return null;
  const notes = await mapDocs([root, ...replies.docs], false);
  return groupThreads(notes).find((t) => t.id === rootId) ?? null;
}

/**
 * Regroupe des notes en fils pour la boîte de réception.
 * Fils antérieurs à ce système (sans threadStatus) : « à traiter » s'il reste
 * une note du client non lue, sinon « réglé » (évite d'inonder la boîte).
 */
export function groupThreads(notes: NoteMeta[]): ThreadSummary[] {
  const byId = new Map(notes.map((n) => [n.id, n]));
  const groups = new Map<string, NoteMeta[]>();
  for (const n of notes) {
    const rootId = n.parentId && byId.has(n.parentId) ? n.parentId : n.id;
    const arr = groups.get(rootId) ?? [];
    arr.push(n);
    groups.set(rootId, arr);
  }
  const threads: ThreadSummary[] = [];
  for (const [rootId, msgs] of groups) {
    const root = byId.get(rootId);
    if (!root) continue;
    msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = msgs[msgs.length - 1];
    const unread = msgs.filter((m) => m.from === "client" && !m.read).length;
    threads.push({
      id: rootId,
      subaccount: root.subaccount,
      title: root.title,
      status: root.threadStatus ?? (unread > 0 ? "open" : "resolved"),
      assignedTo: root.assignedTo ?? null,
      internal: root.internal === true,
      lastActivityAt: root.lastActivityAt && root.lastActivityAt > last.createdAt ? root.lastActivityAt : last.createdAt,
      lastFrom: last.from,
      unread,
      messages: msgs,
    });
  }
  return threads.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

/** Nombre de fils « à traiter » par sous-compte (badges de la page admin). */
export async function openThreadCountsBySubaccount(): Promise<Record<string, number>> {
  if (!adminConfigured()) return {};
  const threads = groupThreads(await listNotes(null));
  const counts: Record<string, number> = {};
  for (const t of threads) {
    if (t.status === "open") counts[t.subaccount] = (counts[t.subaccount] ?? 0) + 1;
  }
  return counts;
}

async function deleteNoteDoc(snap: DocumentSnapshot): Promise<void> {
  const atts = snap.exists && Array.isArray(snap.get("attachments")) ? (snap.get("attachments") as NoteAttachmentStored[]) : [];
  for (const a of atts) {
    if (a.storagePath) await adminBucket().file(a.storagePath).delete().catch(() => {});
  }
  await snap.ref.delete();
}

/** Supprime une note. Supprimer la racine supprime tout le fil (réponses incluses). */
export async function deleteNote(id: string): Promise<void> {
  const snap = await notesCol().doc(id).get();
  if (!snap.exists) return;
  const isRoot = !snap.get("parentId");
  if (isRoot) {
    const replies = await notesCol().where("parentId", "==", id).get();
    for (const r of replies.docs) await deleteNoteDoc(r);
  }
  await deleteNoteDoc(snap);
  invalidateNotes();
}
