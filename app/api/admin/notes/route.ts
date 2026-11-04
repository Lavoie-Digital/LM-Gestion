/* ------------------------------------------------------------------ *
 * Notes clients — gestion (admin) :
 *   GET    ?subaccount=  → notes (incl. programmées et internes) + libère celles échues
 *   POST   { subaccount, title?, body, scheduledFor?, parentId?, internal?, assignedTo? }
 *          → crée / programme / répond + notifie (client et/ou employé assigné)
 *   PATCH  { threadId, action: "status" | "assign" | "read" | "remind", status?, assignedTo? }
 *   DELETE { id }        → supprime (racine = tout le fil ; annule si programmée)
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import {
  addNote,
  attachFilesToNote,
  deleteNote,
  getThread,
  listNotes,
  markThreadRead,
  readNoteFiles,
  resolveThreadRoot,
  updateThread,
  type ThreadStatus,
} from "@/lib/notes";
import { notifyAssignee, notifyClientOfManagerNote, releaseAndNotifyNotes } from "@/lib/note-mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES: ThreadStatus[] = ["open", "waiting", "resolved"];

async function requireAdmin(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return { error: Response.json({ error: "Non authentifié." }, { status: 401 }) };
  if (!id.isAdmin) return { error: Response.json({ error: "Réservé aux admins." }, { status: 403 }) };
  return { id };
}

export async function GET(request: Request) {
  const { id, error } = await requireAdmin(request);
  if (!id) return error;
  const subaccount = new URL(request.url).searchParams.get("subaccount")?.trim() || "";
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  try {
    await releaseAndNotifyNotes().catch(() => 0); // libère les notes programmées échues
    return Response.json({ notes: await listNotes([subaccount]) }); // admin voit tout
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { id, error } = await requireAdmin(request);
  if (!id) return error;

  // Accepte JSON (sans fichier) OU multipart/form-data (avec pièces jointes).
  let subaccount = "";
  let title = "";
  let text = "";
  let scheduledFor: string | null = null;
  let parentId: string | null = null;
  let internal = false;
  let assignedTo: string | null = null;
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
      internal = String(form.get("internal") ?? "") === "true";
      assignedTo = String(form.get("assignedTo") ?? "").trim().toLowerCase() || null;
      files = await readNoteFiles(form);
    } else {
      const body = await request.json();
      subaccount = (body.subaccount ?? "").trim();
      title = (body.title ?? "").trim();
      text = (body.body ?? "").trim();
      scheduledFor = (body.scheduledFor ?? "").trim() || null;
      parentId = (body.parentId ?? "").trim() || null;
      internal = body.internal === true;
      assignedTo = (body.assignedTo ?? "").trim().toLowerCase() || null;
    }
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  if (!text && files.length === 0) return Response.json({ error: "La note est vide." }, { status: 400 });
  if (assignedTo && !EMAIL_RE.test(assignedTo)) return Response.json({ error: "Employé assigné invalide." }, { status: 400 });

  try {
    // Réponse : le fil doit appartenir à ce client. Dans un fil interne, tout reste interne.
    let root: Awaited<ReturnType<typeof resolveThreadRoot>> = null;
    if (parentId) {
      root = await resolveThreadRoot(parentId, subaccount);
      if (!root) return Response.json({ error: "Fil introuvable pour ce client." }, { status: 404 });
      if (root.internal) internal = true;
    }

    const note = await addNote({
      subaccount,
      title: root ? "" : title,
      body: text,
      from: "manager",
      author: id.email,
      scheduledFor,
      parentId: root?.id ?? null,
      internal,
      assignedTo: root ? undefined : assignedTo,
    });
    if (files.length) await attachFilesToNote(note.id, files);

    const preview = text || (files.length ? `${files.length} fichier(s) joint(s)` : "");
    const threadId = root?.id ?? note.id;

    // Client : notifié tout de suite si la note est publique et envoyée
    // (programmée → notifiée à la libération).
    let notified: string[] = [];
    if (!internal && note.status === "sent") {
      notified = await notifyClientOfManagerNote(subaccount, { id: note.id, title: root ? root.title : title, body: preview });
    }

    // Employé : nouveau fil assigné à quelqu'un d'autre, ou note interne
    // ajoutée dans un fil assigné à quelqu'un d'autre.
    const assignee = root ? root.assignedTo : assignedTo;
    if (assignee && assignee !== id.email && (!root || internal)) {
      await notifyAssignee({
        to: assignee,
        threadId,
        subaccount,
        title: root ? root.title : title,
        preview,
        reason: root ? "internal-note" : "assigned",
        by: id.email,
      });
    }

    return Response.json({ ok: true, note, threadId, notified });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { id, error } = await requireAdmin(request);
  if (!id) return error;
  let body: { threadId?: string; action?: string; status?: string; assignedTo?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const threadId = (body.threadId ?? "").trim();
  if (!threadId) return Response.json({ error: "Fil manquant." }, { status: 400 });

  try {
    // Charge le fil (racine + réponses) — sert de validation et de contexte.
    const thread = await getThread(threadId);
    if (!thread) return Response.json({ error: "Fil introuvable." }, { status: 404 });

    switch (body.action) {
      case "status": {
        const status = body.status as ThreadStatus;
        if (!STATUSES.includes(status)) return Response.json({ error: "Statut invalide." }, { status: 400 });
        await updateThread(threadId, { status });
        return Response.json({ ok: true });
      }
      case "assign": {
        const assignedTo = (body.assignedTo ?? "").trim().toLowerCase() || null;
        if (assignedTo && !EMAIL_RE.test(assignedTo)) return Response.json({ error: "Courriel invalide." }, { status: 400 });
        await updateThread(threadId, { assignedTo });
        if (assignedTo && assignedTo !== id.email && assignedTo !== thread.assignedTo) {
          const last = thread.messages[thread.messages.length - 1];
          await notifyAssignee({
            to: assignedTo,
            threadId,
            subaccount: thread.subaccount,
            title: thread.title,
            preview: last?.body ?? "",
            reason: "assigned",
            by: id.email,
          });
        }
        return Response.json({ ok: true });
      }
      case "read": {
        await markThreadRead(threadId);
        return Response.json({ ok: true });
      }
      case "remind": {
        // Relance : renvoie le courriel de la DERNIÈRE note publique envoyée au client.
        const last = [...thread.messages].reverse().find((m) => m.from === "manager" && !m.internal && m.status === "sent");
        if (!last) return Response.json({ error: "Aucune note envoyée au client dans ce fil." }, { status: 400 });
        const notified = await notifyClientOfManagerNote(
          thread.subaccount,
          { id: last.id, title: thread.title, body: last.body || "Fichier(s) joint(s)" },
          { reminder: true }
        );
        if (!notified.length) return Response.json({ error: "Aucun courriel client associé à ce compte (ou envoi refusé)." }, { status: 400 });
        return Response.json({ ok: true, notified });
      }
      default:
        return Response.json({ error: "Action inconnue." }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { id, error } = await requireAdmin(request);
  if (!id) return error;
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
