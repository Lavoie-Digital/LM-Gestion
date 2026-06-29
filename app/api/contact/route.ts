import { COMPANY } from "@/lib/data";

/* ------------------------------------------------------------------ *
 * Formulaire de contact → envoi de courriels via SendGrid.
 *
 *   1. Accusé de réception au CLIENT (expéditeur affiché « LM Gestion
 *      Immobilière », mention d'un délai de réponse de 48 h).
 *   2. Courriel avec les infos du client vers la boîte de réception.
 *
 * SÉCURITÉ : SENDGRID_API_KEY est lue uniquement ici, côté serveur.
 *
 * ⚠️ SendGrid n'envoie QUE depuis une adresse « from » VÉRIFIÉE dans le
 * compte (Single Sender Verification ou domaine authentifié). Réglez
 * CONTACT_FROM_EMAIL sur une adresse vérifiée, sinon SendGrid renvoie 403.
 * ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";
const SENDER_NAME = "LM Gestion Immobilière";

type ContactBody = {
  nom?: string;
  tel?: string;
  courriel?: string;
  parc?: string;
  service?: string;
  message?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* Palette de marque (tokens du site). */
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

/**
 * Enveloppe courriel haut de gamme, compatible clients mail (tables + styles
 * inline uniquement, polices web-safe). En-tête noir + nom serif, filet platine,
 * pied de page sombre — cohérent avec la charte du site.
 */
function emailShell(inner: string, preheader: string): string {
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

type From = { email: string; name: string };

async function sendEmail(
  apiKey: string,
  from: From,
  opts: { to: string; replyTo?: string; subject: string; text: string; html: string }
): Promise<void> {
  const body = {
    personalizations: [{ to: [{ email: opts.to }] }],
    from,
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
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`SendGrid ${res.status}: ${t.slice(0, 400)}`);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Configuration manquante : SENDGRID_API_KEY." },
      { status: 503 }
    );
  }
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "xavier@lavoiedigital.ca";
  const inbox = process.env.CONTACT_INBOX_EMAIL || "xavier@lavoiedigital.ca";

  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const nom = (body.nom ?? "").trim();
  const courriel = (body.courriel ?? "").trim();
  const tel = (body.tel ?? "").trim();
  const parc = (body.parc ?? "").trim();
  const service = (body.service ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!nom || !courriel || !isEmail(courriel)) {
    return Response.json(
      { error: "Veuillez fournir au moins votre nom et un courriel valide." },
      { status: 400 }
    );
  }

  const from: From = { email: fromEmail, name: SENDER_NAME };

  // 1 — Accusé de réception au client --------------------------------
  const ackSubject = "Nous avons bien reçu votre demande — LM Gestion Immobilière";
  const ackText =
    `Bonjour ${nom},\n\n` +
    `Merci d'avoir communiqué avec LM Gestion Immobilière. Nous avons bien reçu votre message ` +
    `et un membre de notre équipe vous répondra dans un délai de 48 heures.\n\n` +
    `Pour toute urgence, vous pouvez nous joindre au ${COMPANY.phone}.\n\n` +
    `Au plaisir,\nL'équipe de LM Gestion Immobilière\n${COMPANY.phone} · ${COMPANY.email}`;
  const ackHtml = emailShell(
    `<h1 style="margin:0;font:400 23px/1.3 ${SERIF};color:${BRAND.ink};">Votre demande a bien été reçue</h1>
     <p style="margin:22px 0 0;font:400 15px/1.7 ${SANS};color:${BRAND.smoke};">Bonjour <strong style="color:${BRAND.ink};font-weight:600;">${escapeHtml(nom)}</strong>,</p>
     <p style="margin:14px 0 0;font:400 15px/1.7 ${SANS};color:${BRAND.smoke};">Merci d'avoir communiqué avec <strong style="color:${BRAND.ink};font-weight:600;">LM Gestion Immobilière</strong>. Nous avons bien reçu votre message, et un membre de notre équipe vous répondra avec soin.</p>
     <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;"><tr><td style="border:1px solid ${BRAND.line};border-left:3px solid ${BRAND.platinum};background:${BRAND.paper};padding:18px 22px;">
       <div style="font:600 9px/1 ${SANS};letter-spacing:2.5px;text-transform:uppercase;color:${BRAND.smoke};">Délai de réponse</div>
       <div style="margin-top:9px;font:400 19px/1.2 ${SERIF};color:${BRAND.ink};">Sous 48 heures</div>
     </td></tr></table>
     <p style="margin:0;font:400 15px/1.7 ${SANS};color:${BRAND.smoke};">Pour toute urgence, joignez-nous au <strong style="color:${BRAND.ink};font-weight:600;">${escapeHtml(COMPANY.phone)}</strong>.</p>
     <p style="margin:28px 0 0;font:400 15px/1.7 ${SANS};color:${BRAND.ink};">Au plaisir,<br/><span style="font-family:${SERIF};font-style:italic;">L'équipe de LM Gestion Immobilière</span></p>`,
    "Nous avons bien reçu votre demande — réponse sous 48 heures."
  );

  // 2 — Notification interne (infos du client) -----------------------
  const leadRow = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:11px 0;border-bottom:1px solid ${BRAND.line};font:600 9px/1.4 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${BRAND.smoke};width:42%;vertical-align:top;">${label}</td><td style="padding:11px 0;border-bottom:1px solid ${BRAND.line};font:400 15px/1.5 ${SANS};color:${BRAND.ink};">${escapeHtml(value)}</td></tr>`
      : "";
  const leadSubject = `Nouvelle demande de contact — ${nom}`;
  const leadText =
    `Nouvelle demande via le formulaire du site :\n\n` +
    `Nom : ${nom}\nCourriel : ${courriel}\nTéléphone : ${tel || "—"}\n` +
    `Taille du parc : ${parc || "—"}\nService recherché : ${service || "—"}\n\n` +
    `Message :\n${message || "—"}`;
  const leadHtml = emailShell(
    `<h1 style="margin:0;font:400 23px/1.3 ${SERIF};color:${BRAND.ink};">Nouvelle demande de contact</h1>
     <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 0;border-top:1px solid ${BRAND.line};">
       ${leadRow("Nom", nom)}${leadRow("Courriel", courriel)}${leadRow("Téléphone", tel)}${leadRow("Taille du parc", parc)}${leadRow("Service recherché", service)}
     </table>
     <div style="margin:26px 0 9px;font:600 9px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${BRAND.smoke};">Message</div>
     <div style="font:400 15px/1.7 ${SANS};color:${BRAND.ink};background:${BRAND.paper};border:1px solid ${BRAND.line};padding:16px 18px;white-space:pre-wrap;">${escapeHtml(message || "—")}</div>`,
    `Nouvelle demande — ${nom}`
  );

  try {
    // Accusé au client (réponse dirigée vers la boîte LM).
    await sendEmail(apiKey, from, {
      to: courriel,
      replyTo: COMPANY.email,
      subject: ackSubject,
      text: ackText,
      html: ackHtml,
    });
    // Notification interne (réponse dirigée vers le client).
    await sendEmail(apiKey, from, {
      to: inbox,
      replyTo: courriel,
      subject: leadSubject,
      text: leadText,
      html: leadHtml,
    });
  } catch (err) {
    console.error("[contact] ✖ Envoi SendGrid échoué :", err);
    return Response.json(
      { error: "L'envoi du courriel a échoué. Réessayez ou contactez-nous par téléphone." },
      { status: 502 }
    );
  }

  console.log(`[contact] ✓ Courriels envoyés (client: ${courriel}, boîte: ${inbox}).`);
  return Response.json({ ok: true });
}
