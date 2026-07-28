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
import { addNote, listNotes } from "@/lib/notes";
import { brandedBody, escapeHtml, sendBrandedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export async function GET(request: Request) {
  if (!authConfigured()) return Response.json({ notes: [] });
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });

  const viewAs = new URL(request.url).searchParams.get("viewAs")?.trim() || "";
  const subaccounts = id.isAdmin ? (viewAs ? [viewAs] : null) : await subaccountsForOwnerEmail(id.email);

  try {
    return Response.json({ notes: await listNotes(subaccounts) });
  } catch (err) {
    return Response.json({ notes: [], error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });

  let body: { body?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const text = (body.body ?? "").trim();
  const title = (body.title ?? "").trim();
  if (!text) return Response.json({ error: "La note est vide." }, { status: 400 });

  // Le client écrit depuis SON périmètre. On rattache la note à son sous-compte.
  const subs = await subaccountsForOwnerEmail(id.email);
  const subaccount = subs[0];
  if (!subaccount) {
    return Response.json({ error: "Aucun parc associé à votre compte." }, { status: 400 });
  }

  try {
    const note = await addNote({ subaccount, title, body: text, from: "client", author: id.email });

    // Destinataire(s) : le GESTIONNAIRE ASSIGNÉ à ce sous-compte s'il y en a un ;
    // sinon, repli sur les gestionnaires (admins base + boîte de contact), le
    // dev (admins « env ») étant toujours exclu.
    const assigned = await getManager(subaccount).catch(() => null);
    let recipients: string[];
    if (assigned) {
      recipients = [assigned];
    } else {
      const dbAdmins = await listDbAdmins().catch(() => []);
      const inbox = process.env.CONTACT_INBOX_EMAIL?.trim().toLowerCase();
      recipients = [...new Set([...dbAdmins.map((a) => a.email), ...(inbox ? [inbox] : [])])].filter(
        (e) => !ADMIN_EMAILS.includes(e)
      );
    }
    const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
    const html = brandedBody({
      heading: "Nouveau message d'un client",
      paragraphs: [
        `Le client <strong style="color:#0b0b0c;">${escapeHtml(id.email)}</strong> (${escapeHtml(subaccount)}) vous a écrit :`,
        `<span style="display:block;border-left:3px solid #c6c4bd;padding-left:14px;color:#0b0b0c;white-space:pre-wrap;">${escapeHtml(preview)}</span>`,
      ],
      ctaText: "Ouvrir la zone admin",
      ctaUrl: `${SITE_URL}/admin`,
      preheader: `Message de ${id.email}`,
    });
    const textMail = `Le client ${id.email} (${subaccount}) vous a écrit :\n\n${preview}\n\nZone admin : ${SITE_URL}/admin`;
    await Promise.allSettled(
      recipients.map((to) => sendBrandedEmail({ to, subject: "Message d'un client — LM Gestion Immobilière", html, text: textMail, replyTo: id.email }))
    );

    return Response.json({ ok: true, note, notified: recipients.length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
