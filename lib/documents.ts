/* ------------------------------------------------------------------ *
 * Documents clients — fichiers dans Firebase Storage, métadonnées dans Firestore.
 *
 * La gestionnaire dépose un document depuis /admin (assigné à un sous-compte) ;
 * le client le retrouve dans son tableau de bord. Tout passe par le serveur
 * (Admin SDK) : le client ne reçoit qu'une URL signée temporaire pour télécharger.
 *
 * Collection Firestore : `documents`. Chemin Storage : documents/<docId>/<nom>.
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminBucket, adminConfigured, adminDb } from "./firebase-admin";

export type DocumentMeta = {
  id: string;
  subaccount: string;
  name: string;
  folder: string; // "" = racine
  contentType: string;
  size: number;
  uploadedAt: string; // ISO
  uploadedBy?: string;
  url?: string; // URL de téléchargement signée (générée à la lecture)
};

const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

function safeName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "document";
}

/** Dépose un fichier et enregistre ses métadonnées. */
export async function uploadDocument(input: {
  subaccount: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
  folder?: string;
  uploadedBy?: string;
}): Promise<DocumentMeta> {
  const db = adminDb();
  const ref = db.collection("documents").doc();
  const name = safeName(input.filename);
  const storagePath = `documents/${ref.id}/${name}`;
  const folder = (input.folder ?? "").trim();

  await adminBucket().file(storagePath).save(input.buffer, {
    resumable: false,
    contentType: input.contentType || "application/octet-stream",
    metadata: { contentType: input.contentType || "application/octet-stream" },
  });

  const uploadedAt = new Date().toISOString();
  await ref.set({
    subaccount: input.subaccount.trim(),
    name: input.filename,
    folder,
    storagePath,
    contentType: input.contentType || "application/octet-stream",
    size: input.buffer.length,
    uploadedAt,
    uploadedBy: input.uploadedBy ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id: ref.id,
    subaccount: input.subaccount.trim(),
    name: input.filename,
    folder,
    contentType: input.contentType || "application/octet-stream",
    size: input.buffer.length,
    uploadedAt,
    uploadedBy: input.uploadedBy,
  };
}

/* ---- Dossiers (arborescence simple par sous-compte) ---- */
export async function listFolders(subaccount: string): Promise<string[]> {
  if (!adminConfigured()) return [];
  const snap = await adminDb().collection("doc_folders").where("subaccount", "==", subaccount.trim()).get();
  return snap.docs.map((d) => String(d.get("name") ?? "")).filter(Boolean).sort();
}

export async function createFolder(subaccount: string, name: string): Promise<void> {
  const db = adminDb();
  const sa = subaccount.trim();
  const n = name.trim().slice(0, 60);
  if (!n) return;
  const dup = await db.collection("doc_folders").where("subaccount", "==", sa).where("name", "==", n).limit(1).get();
  if (!dup.empty) return;
  await db.collection("doc_folders").add({ subaccount: sa, name: n, createdAt: FieldValue.serverTimestamp() });
}

export async function deleteFolder(subaccount: string, name: string): Promise<void> {
  const db = adminDb();
  const sa = subaccount.trim();
  const n = name.trim();
  const snap = await db.collection("doc_folders").where("subaccount", "==", sa).where("name", "==", n).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  // Les documents du dossier retournent à la racine.
  const docs = await db.collection("documents").where("subaccount", "==", sa).where("folder", "==", n).get();
  const b2 = db.batch();
  docs.docs.forEach((d) => b2.update(d.ref, { folder: "" }));
  await b2.commit();
}

/** Liste les documents pour un périmètre. null = tous ; [] = aucun. Avec URL signées. */
export async function listDocuments(subaccounts: string[] | null): Promise<DocumentMeta[]> {
  if (!adminConfigured()) return [];
  const db = adminDb();
  let docs;
  if (subaccounts === null) {
    docs = (await db.collection("documents").get()).docs;
  } else if (subaccounts.length === 0) {
    return [];
  } else {
    docs = (await db.collection("documents").where("subaccount", "in", subaccounts.slice(0, 30)).get()).docs;
  }

  const out = await Promise.all(
    docs.map(async (d) => {
      const x = d.data();
      let url: string | undefined;
      try {
        const [signed] = await adminBucket()
          .file(String(x.storagePath))
          .getSignedUrl({ action: "read", expires: Date.now() + SIGNED_URL_TTL_MS });
        url = signed;
      } catch {
        url = undefined;
      }
      return {
        id: d.id,
        subaccount: String(x.subaccount ?? ""),
        name: String(x.name ?? "document"),
        folder: String(x.folder ?? ""),
        contentType: String(x.contentType ?? "application/octet-stream"),
        size: typeof x.size === "number" ? x.size : 0,
        uploadedAt: String(x.uploadedAt ?? ""),
        uploadedBy: x.uploadedBy ?? undefined,
        url,
      } satisfies DocumentMeta;
    })
  );
  return out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/** Supprime un document (fichier Storage + métadonnées). Renvoie son sous-compte. */
export async function deleteDocument(id: string): Promise<string | null> {
  const db = adminDb();
  const ref = db.collection("documents").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const path = snap.get("storagePath");
  if (typeof path === "string") await adminBucket().file(path).delete().catch(() => {});
  await ref.delete();
  return (snap.get("subaccount") as string) ?? null;
}
