/* ------------------------------------------------------------------ *
 * Notes clients — gestion (admin) :
 *   GET    ?subaccount=  → notes d'un sous-compte
 *   POST   { subaccount, title?, body } → crée + notifie le(s) client(s)
 *   DELETE { id }        → supprime
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { addNote, deleteNote, listNotes } from "@/lib/notes";
import { emailsForSubaccount } from "@/lib/owners-admin";
import { brandedBody, escapeHtml, sendBrandedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  const subaccount = new URL(request.url).searchParams.get("subaccount")?.trim() || "";
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  try {
    return Response.json({ notes: await listNotes([subaccount]) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { subaccount?: string; title?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const subaccount = (body.subaccount ?? "").trim();
  const title = (body.title ?? "").trim();
  const text = (body.body ?? "").trim();
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  if (!text) return Response.json({ error: "La note est vide." }, { status: 400 });

  try {
    const note = await addNote({ subaccount, title, body: text, createdBy: id.email });

    const emails = await emailsForSubaccount(subaccount).catch(() => []);
    const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
    const html = brandedBody({
      heading: note.title || "Une nouvelle note de votre gestionnaire",
      paragraphs: [
        "Bonjour,",
        "Votre gestionnaire vient de vous laisser une note dans votre espace client :",
        `<span style="display:block;border-left:3px solid #c6c4bd;padding-left:14px;color:#0b0b0c;white-space:pre-wrap;">${escapeHtml(preview)}</span>`,
        "Connectez-vous pour la consulter en entier.",
      ],
      ctaText: "Voir mon tableau de bord",
      ctaUrl: `${SITE_URL}/connexion`,
      preheader: note.title || "Nouvelle note de votre gestionnaire",
    });
    const textMail = `Bonjour,\n\nVotre gestionnaire vous a laissé une note :\n\n${preview}\n\nConnectez-vous : ${SITE_URL}/connexion\n\nLM Gestion Immobilière`;
    await Promise.allSettled(
      emails.map((to) =>
        sendBrandedEmail({ to, subject: "Nouvelle note — LM Gestion Immobilière", html, text: textMail })
      )
    );

    return Response.json({ ok: true, note, notified: emails.length });
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
