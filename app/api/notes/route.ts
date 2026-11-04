/* ------------------------------------------------------------------ *
 * Notes visibles par l'utilisateur connecté (fil bidirectionnel).
 *   GET  → notes de son périmètre (gestionnaire ↔ client)
 *   POST → le CLIENT écrit une note à son gestionnaire (notifie les admins)
 * ------------------------------------------------------------------ */

import { authConfigured } from "@/lib/firebase-admin";
import { ADMIN_EMAILS, verifyBearer } from "@/lib/access";
import { subaccountsForOwnerEmail } from "@/lib/owners-admin";
import { listDbAdmins } from "@/lib/admins";
import { getManager } from "@/lib/managers";
import { addNote, attachFilesToNote, listNotes, markSeenByClient, readNoteFiles, resolveThreadRoot } from "@/lib/notes";
import { notifyAssignee, releaseAndNotifyNotes, threadUrl } from "@/lib/note-mailer";
import { brandedBody, escapeHtml, sendBrandedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


export async function GET(request: Request) {
  if (!authConfigured()) return Response.json({ notes: [] });
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });

  const viewAs = new URL(request.url).searchParams.get("viewAs")?.trim() || "";
  const subaccounts = id.isAdmin ? (viewAs ? [viewAs] : null) : await subaccountsForOwnerEmail(id.email);

  try {
    await releaseAndNotifyNotes().catch(() => 0); // libère les notes programmées échues
    // Le client ne voit QUE les notes envoyées et publiques (ni programmées, ni internes).
    const notes = await listNotes(subaccounts, { onlySent: true, excludeInternal: true });
    // Suivi « vu par le client » — seulement pour un vrai client (pas un admin en « Voir en tant que »).
    if (!id.isAdmin && subaccounts) await markSeenByClient(subaccounts).catch(() => {});
    return Response.json({ notes });
  } catch (err) {
    return Response.json({ notes: [], error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });

  // JSON (sans fichier) OU multipart/form-data (avec pièces jointes).
  let text = "";
  let title = "";
  let parentId: string | null = null;
  let files: { name: string; contentType: string; buffer: Buffer }[] = [];
  const ct = request.headers.get("content-type") ?? "";
  try {
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      text = String(form.get("body") ?? "").trim();
      title = String(form.get("title") ?? "").trim();
      parentId = String(form.get("parentId") ?? "").trim() || null;
      files = await readNoteFiles(form);
    } else {
      const body = await request.json();
      text = (body.body ?? "").trim();
      title = (body.title ?? "").trim();
      parentId = (body.parentId ?? "").trim() || null;
    }
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!text && files.length === 0) return Response.json({ error: "La note est vide." }, { status: 400 });

  // Le client écrit depuis SON périmètre. On rattache la note à son sous-compte.
  const subs = await subaccountsForOwnerEmail(id.email);
  const subaccount = subs[0];
  if (!subaccount) {
    return Response.json({ error: "Aucun parc associé à votre compte." }, { status: 400 });
  }

  try {
    // Réponse : le fil doit appartenir au parc du client et ne pas être interne.
    let root: Awaited<ReturnType<typeof resolveThreadRoot>> = null;
    if (parentId) {
      root = await resolveThreadRoot(parentId, subaccount);
      if (!root || root.internal) return Response.json({ error: "Fil introuvable." }, { status: 404 });
    }

    // Nouveau sujet → assigné d'office au gestionnaire du client (s'il y en a un).
    const clientManager = await getManager(subaccount).catch(() => null);
    const note = await addNote({
      subaccount,
      title: root ? "" : title,
      body: text,
      from: "client",
      author: id.email,
      parentId: root?.id ?? null,
      assignedTo: root ? undefined : clientManager,
    });
    if (files.length) await attachFilesToNote(note.id, files);
    const threadId = root?.id ?? note.id;
    const base = text || (files.length ? `${files.length} fichier(s) joint(s)` : "");

    // Fil déjà assigné à un employé → c'est lui qu'on avise, avec un lien direct.
    if (root?.assignedTo) {
      await notifyAssignee({ to: root.assignedTo, threadId, subaccount, title: root.title, preview: base, reason: "client-reply" });
      return Response.json({ ok: true, note, notified: 1 });
    }

    // Sinon : le GESTIONNAIRE ASSIGNÉ à ce sous-compte s'il y en a un ;
    // sinon, repli sur les gestionnaires (admins base + boîte de contact), le
    // dev (admins « env ») étant toujours exclu.
    let recipients: string[];
    if (clientManager) {
      recipients = [clientManager];
    } else {
      const dbAdmins = await listDbAdmins().catch(() => []);
      const inbox = process.env.CONTACT_INBOX_EMAIL?.trim().toLowerCase();
      recipients = [...new Set([...dbAdmins.map((a) => a.email), ...(inbox ? [inbox] : [])])].filter(
        (e) => !ADMIN_EMAILS.includes(e)
      );
    }
    const preview = base.length > 400 ? `${base.slice(0, 400)}…` : base;
    const html = brandedBody({
      heading: "Nouveau message d'un client",
      paragraphs: [
        `Le client <strong style="color:#0b0b0c;">${escapeHtml(id.email)}</strong> (${escapeHtml(subaccount)}) vous a écrit :`,
        `<span style="display:block;border-left:3px solid #c6c4bd;padding-left:14px;color:#0b0b0c;white-space:pre-wrap;">${escapeHtml(preview)}</span>`,
      ],
      ctaText: "Ouvrir le fil",
      ctaUrl: threadUrl(threadId),
      preheader: `Message de ${id.email}`,
    });
    const textMail = `Le client ${id.email} (${subaccount}) vous a écrit :\n\n${preview}\n\nOuvrir le fil : ${threadUrl(threadId)}`;
    await Promise.allSettled(
      recipients.map((to) => sendBrandedEmail({ to, subject: "Message d'un client — LM Gestion Immobilière", html, text: textMail, replyTo: id.email }))
    );

    return Response.json({ ok: true, note, notified: recipients.length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
