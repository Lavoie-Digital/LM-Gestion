/* ------------------------------------------------------------------ *
 * Notes clients — gestion (admin) :
 *   GET    ?subaccount=  → notes (incl. programmées) + libère celles échues
 *   POST   { subaccount, title?, body, scheduledFor? } → crée/programme + notifie
 *   DELETE { id }        → supprime (annule si programmée)
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { addNote, attachFilesToNote, deleteNote, listNotes, markNotesRead, readNoteFiles } from "@/lib/notes";
import { notifyClientOfManagerNote, releaseAndNotifyNotes } from "@/lib/note-mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  const subaccount = new URL(request.url).searchParams.get("subaccount")?.trim() || "";
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  try {
    await releaseAndNotifyNotes().catch(() => 0); // libère les notes programmées échues
    const notes = await listNotes([subaccount]); // admin voit tout, incl. programmées
    await markNotesRead(subaccount).catch(() => {});
    return Response.json({ notes });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  // Accepte JSON (sans fichier) OU multipart/form-data (avec pièces jointes).
  let subaccount = "";
  let title = "";
  let text = "";
  let scheduledFor: string | null = null;
  let parentId: string | null = null;
  let files: { name: string; contentType: string; buffer: Buffer }[] = [];
  const ct = request.headers.get("content-type") ?? "";
  try {
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      subaccount = String(form.get("subaccount") ?? "").trim();
      title = String(form.get("title") ?? "").trim();
      text = String(form.get("body") ?? "").trim();
      scheduledFor = String(form.get("scheduledFor") ?? "").trim() || null;
      parentId = String(form.get("parentId") ?? "").trim() || null;
      files = await readNoteFiles(form);
    } else {
      const body = await request.json();
      subaccount = (body.subaccount ?? "").trim();
      title = (body.title ?? "").trim();
      text = (body.body ?? "").trim();
      scheduledFor = (body.scheduledFor ?? "").trim() || null;
      parentId = (body.parentId ?? "").trim() || null;
    }
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  if (!text && files.length === 0) return Response.json({ error: "La note est vide." }, { status: 400 });

  try {
    const note = await addNote({ subaccount, title, body: text, from: "manager", author: id.email, scheduledFor, parentId });
    if (files.length) await attachFilesToNote(note.id, files);
    // Envoi immédiat → on notifie tout de suite. Programmé → notifié à la libération.
    let notified = 0;
    if (note.status === "sent") {
      notified = await notifyClientOfManagerNote(subaccount, { title, body: text || (files.length ? `${files.length} fichier(s) joint(s)` : "") });
    }
    return Response.json({ ok: true, note, notified });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  try {
    await deleteNote(body.id);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
