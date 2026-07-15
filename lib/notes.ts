/* ------------------------------------------------------------------ *
 * Notes clients — messages texte écrits par la gestionnaire (depuis /admin)
 * pour un sous-compte, affichés dans le tableau de bord du client.
 * Firestore `notes`. Tout passe par le serveur (Admin SDK).
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";

export type NoteFrom = "manager" | "client";

export type NoteMeta = {
  id: string;
  subaccount: string;
  title: string;
  body: string;
  from: NoteFrom;
  author?: string;
  createdAt: string; // ISO
};

export async function addNote(input: {
  subaccount: string;
  title: string;
  body: string;
  from: NoteFrom;
  author?: string;
}): Promise<NoteMeta> {
  const db = adminDb();
  const ref = db.collection("notes").doc();
  const createdAt = new Date().toISOString();
  const note = {
    subaccount: input.subaccount.trim(),
    title: input.title.trim(),
    body: input.body.trim(),
    from: input.from,
    author: input.author ?? null,
    createdAt,
  };
  await ref.set({ ...note, serverCreatedAt: FieldValue.serverTimestamp() });
  return { id: ref.id, subaccount: note.subaccount, title: note.title, body: note.body, from: note.from, author: input.author, createdAt };
}

export async function listNotes(subaccounts: string[] | null): Promise<NoteMeta[]> {
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
        createdAt: String(x.createdAt ?? ""),
      } satisfies NoteMeta;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteNote(id: string): Promise<void> {
  await adminDb().collection("notes").doc(id).delete();
}
