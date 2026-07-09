/* ------------------------------------------------------------------ *
 * Envoi de courriels de marque (SendGrid) — réutilisable côté serveur.
 * Même charte que le courriel du formulaire de contact.
 * SÉCURITÉ : SENDGRID_API_KEY lue uniquement ici (serveur).
 * ------------------------------------------------------------------ */

import { COMPANY } from "@/lib/data";

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";
const SENDER_NAME = "LM Gestion Immobilière";

const BRAND = {
  ink: "#0b0b0c",
  noir: "#000000",
  paper: "#f4f3f0",
  card: "#ffffff",
  smoke: "#54545a",
  ash: "#a0a0a6",
  platinum: "#c6c4bd",
  line: "#e3e1dc",
};
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function shell(inner: string, preheader: string): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background:${BRAND.paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${BRAND.card};border:1px solid ${BRAND.line};">
      <tr><td style="background:${BRAND.ink};padding:34px 40px;">
        <div style="font:600 10px/1 ${SANS};letter-spacing:3px;text-transform:uppercase;color:${BRAND.ash};">Maison de gestion privée</div>
        <div style="margin-top:13px;font:400 26px/1.15 ${SERIF};color:${BRAND.paper};letter-spacing:0.3px;">LM Gestion Immobilière</div>
      </td></tr>
      <tr><td style="height:3px;line-height:3px;font-size:0;background:${BRAND.platinum};">&nbsp;</td></tr>
      <tr><td style="padding:40px;">${inner}</td></tr>
      <tr><td style="background:${BRAND.noir};padding:28px 40px;">
        <div style="font:400 13px/1.8 ${SANS};color:${BRAND.ash};">${escapeHtml(COMPANY.phone)}<br/>${escapeHtml(COMPANY.email)}<br/>${escapeHtml(COMPANY.address)}</div>
        <div style="margin-top:14px;font:600 9px/1.4 ${SANS};letter-spacing:2.5px;text-transform:uppercase;color:#6f6f75;">Est. ${COMPANY.founded} · Saguenay–Lac-Saint-Jean</div>
      </td></tr>
    </table>
    <div style="margin-top:16px;font:400 11px/1.5 ${SANS};color:${BRAND.smoke};">© ${year} LM Gestion Immobilière · Tous droits réservés</div>
  </td></tr>
</table>
</body></html>`;
}

/** Construit un corps HTML de marque : titre + paragraphes + bouton optionnel. */
export function brandedBody(opts: {
  heading: string;
  paragraphs: string[];
  ctaText?: string;
  ctaUrl?: string;
  preheader?: string;
}): string {
  const paras = opts.paragraphs
    .map((p) => `<p style="margin:14px 0 0;font:400 15px/1.7 ${SANS};color:${BRAND.smoke};">${p}</p>`)
    .join("");
  const cta =
    opts.ctaText && opts.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0;"><tr><td style="background:${BRAND.ink};">
           <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 30px;font:600 12px/1 ${SANS};letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.paper};text-decoration:none;">${escapeHtml(opts.ctaText)}</a>
         </td></tr></table>`
      : "";
  const inner = `<h1 style="margin:0;font:400 23px/1.3 ${SERIF};color:${BRAND.ink};">${escapeHtml(opts.heading)}</h1>${paras}${cta}`;
  return shell(inner, opts.preheader ?? opts.heading);
}

/** Envoie un courriel de marque. No-op silencieux si SendGrid non configuré. */
export async function sendBrandedEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "xavier@lavoiedigital.ca";
  if (!apiKey) return false;
  const body = {
    personalizations: [{ to: [{ email: opts.to }] }],
    from: { email: fromEmail, name: SENDER_NAME },
    ...(opts.replyTo ? { reply_to: { email: opts.replyTo } } : {}),
    subject: opts.subject,
    content: [
      { type: "text/plain", value: opts.text },
      { type: "text/html", value: opts.html },
    ],
  };
  const res = await fetch(SENDGRID_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SendGrid ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  return true;
}
