/* ------------------------------------------------------------------ *
 * Courriels liés aux notes :
 *  - au CLIENT : nouvelle note du gestionnaire (envoi immédiat, libération
 *    d'une note programmée, ou relance) — les envois réussis sont consignés
 *    sur la note (suivi « courriel envoyé à … » dans la boîte de réception) ;
 *  - à l'EMPLOYÉ assigné : fil assigné, nouvelle réponse du client, note interne.
 * ------------------------------------------------------------------ */

import { emailsForSubaccount } from "@/lib/owners-admin";
import { brandedBody, escapeHtml, sendBrandedEmail } from "@/lib/email";
import { recordEmailed, releaseDueNotes } from "@/lib/notes";

const SITE_URL = "https://lmgestionimmobiliere.ca";

const quote = (s: string) =>
  `<span style="display:block;border-left:3px solid #c6c4bd;padding-left:14px;color:#0b0b0c;white-space:pre-wrap;">${escapeHtml(s)}</span>`;
const clip = (s: string, n = 400) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Lien direct vers un fil dans la boîte de réception admin. */
export const threadUrl = (threadId: string) => `${SITE_URL}/admin/notes?thread=${encodeURIComponent(threadId)}`;

/** Notifie le client d'une note du gestionnaire. Renvoie les adresses réellement jointes. */
export async function notifyClientOfManagerNote(
  subaccount: string,
  note: { id?: string; title?: string; body: string },
  opts?: { reminder?: boolean }
): Promise<string[]> {
  const emails = await emailsForSubaccount(subaccount).catch(() => []);
  if (!emails.length) {
    if (note.id) await recordEmailed(note.id, [], opts).catch(() => {});
    return [];
  }
  const preview = clip(note.body);
  const reminder = opts?.reminder === true;
  const html = brandedBody({
    heading: reminder
      ? "Rappel : une note vous attend"
      : note.title?.trim() || "Une nouvelle note de votre gestionnaire",
    paragraphs: [
      "Bonjour,",
      reminder
        ? "Petit rappel : votre gestionnaire vous a laissé une note dans votre espace client et attend votre retour :"
        : "Votre gestionnaire vient de vous laisser une note dans votre espace client :",
      quote(preview),
      "Connectez-vous pour la consulter et y répondre.",
    ],
    ctaText: "Voir mon tableau de bord",
    ctaUrl: `${SITE_URL}/connexion`,
    preheader: reminder ? "Rappel — note de votre gestionnaire" : note.title?.trim() || "Nouvelle note de votre gestionnaire",
  });
  const text = `Bonjour,\n\n${reminder ? "Rappel — v" : "V"}otre gestionnaire vous a laissé une note :\n\n${preview}\n\nConnectez-vous : ${SITE_URL}/connexion`;
  const subject = reminder ? "Rappel : note de votre gestionnaire — LM Gestion Immobilière" : "Nouvelle note — LM Gestion Immobilière";
  const results = await Promise.allSettled(emails.map((to) => sendBrandedEmail({ to, subject, html, text })));
  const delivered = emails.filter((_, i) => {
    const r = results[i];
    return r.status === "fulfilled" && r.value === true;
  });
  if (note.id) await recordEmailed(note.id, delivered, { reminder }).catch(() => {});
  return delivered;
}

/** Avise un employé (admin) qu'un fil demande son attention. */
export async function notifyAssignee(opts: {
  to: string;
  threadId: string;
  subaccount: string;
  title?: string;
  preview: string;
  reason: "assigned" | "client-reply" | "internal-note";
  by?: string;
}): Promise<boolean> {
  const heading =
    opts.reason === "assigned"
      ? "Une note vous a été assignée"
      : opts.reason === "client-reply"
        ? "Un client a répondu dans un de vos fils"
        : "Nouvelle note interne dans un de vos fils";
  const intro =
    opts.reason === "assigned"
      ? `${opts.by ? `<strong style="color:#0b0b0c;">${escapeHtml(opts.by)}</strong> vous a assigné` : "On vous a assigné"} une note du client <strong style="color:#0b0b0c;">${escapeHtml(opts.subaccount)}</strong>${opts.title ? ` : « ${escapeHtml(opts.title)} »` : ""}.`
      : opts.reason === "client-reply"
        ? `Le client <strong style="color:#0b0b0c;">${escapeHtml(opts.subaccount)}</strong> a écrit${opts.title ? ` dans « ${escapeHtml(opts.title)} »` : ""} :`
        : `${opts.by ? escapeHtml(opts.by) : "Un collègue"} a ajouté une note interne (client ${escapeHtml(opts.subaccount)}) :`;
  const preview = clip(opts.preview);
  const html = brandedBody({
    heading,
    paragraphs: [intro, ...(preview ? [quote(preview)] : []), "Ouvrez le fil pour vous en occuper."],
    ctaText: "Ouvrir le fil",
    ctaUrl: threadUrl(opts.threadId),
    preheader: heading,
  });
  const text = `${heading} — client ${opts.subaccount}\n\n${preview}\n\nOuvrir : ${threadUrl(opts.threadId)}`;
  return sendBrandedEmail({ to: opts.to, subject: `${heading} — LM Gestion Immobilière`, html, text }).catch(() => false);
}

/** Libère les notes programmées échues et envoie leur courriel. Renvoie le nb libéré. */
export async function releaseAndNotifyNotes(): Promise<number> {
  const released = await releaseDueNotes().catch(() => []);
  let n = 0;
  for (const r of released) {
    if (r.from === "manager" && !r.internal) {
      await notifyClientOfManagerNote(r.subaccount, { id: r.id, title: r.title, body: r.body }).catch(() => {});
      n++;
    }
  }
  return n;
}
