/* ------------------------------------------------------------------ *
 * Envoi de la notification courriel d'une note du gestionnaire vers le client.
 * Utilisé à l'envoi immédiat ET à la libération d'une note programmée.
 * ------------------------------------------------------------------ */

import { emailsForSubaccount } from "@/lib/owners-admin";
import { brandedBody, escapeHtml, sendBrandedEmail } from "@/lib/email";
import { releaseDueNotes } from "@/lib/notes";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export async function notifyClientOfManagerNote(subaccount: string, note: { title?: string; body: string }): Promise<number> {
  const emails = await emailsForSubaccount(subaccount).catch(() => []);
  if (!emails.length) return 0;
  const preview = note.body.length > 400 ? `${note.body.slice(0, 400)}…` : note.body;
  const html = brandedBody({
    heading: note.title?.trim() || "Une nouvelle note de votre gestionnaire",
    paragraphs: [
      "Bonjour,",
      "Votre gestionnaire vient de vous laisser une note dans votre espace client :",
      `<span style="display:block;border-left:3px solid #c6c4bd;padding-left:14px;color:#0b0b0c;white-space:pre-wrap;">${escapeHtml(preview)}</span>`,
      "Connectez-vous pour la consulter et y répondre.",
    ],
    ctaText: "Voir mon tableau de bord",
    ctaUrl: `${SITE_URL}/connexion`,
    preheader: note.title?.trim() || "Nouvelle note de votre gestionnaire",
  });
  const text = `Bonjour,\n\nVotre gestionnaire vous a laissé une note :\n\n${preview}\n\nConnectez-vous : ${SITE_URL}/connexion`;
  await Promise.allSettled(
    emails.map((to) => sendBrandedEmail({ to, subject: "Nouvelle note — LM Gestion Immobilière", html, text }))
  );
  return emails.length;
}

/** Libère les notes programmées échues et envoie leur courriel. Renvoie le nb libéré. */
export async function releaseAndNotifyNotes(): Promise<number> {
  const released = await releaseDueNotes().catch(() => []);
  let n = 0;
  for (const r of released) {
    if (r.from === "manager") {
      await notifyClientOfManagerNote(r.subaccount, { title: r.title, body: r.body }).catch(() => {});
      n++;
    }
  }
  return n;
}
