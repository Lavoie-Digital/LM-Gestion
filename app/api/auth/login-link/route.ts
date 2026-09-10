/* ------------------------------------------------------------------ *
 * Lien de connexion sans mot de passe — envoyé par NOUS via SendGrid (domaine
 * authentifié lmgestionimmobiliere.ca) plutôt que par Firebase (dont l'adresse
 * noreply@…firebaseapp.com est souvent filtrée par Hotmail/Outlook).
 *
 * On génère le lien avec l'Admin SDK, on l'envoie avec notre gabarit de marque.
 * On n'envoie qu'aux courriels AUTORISÉS (client lié ou admin) — pas de spam.
 * ------------------------------------------------------------------ */

import { adminAuthPrivileged, adminConfigured, authConfigured } from "@/lib/firebase-admin";
import { resolveIsAdmin } from "@/lib/access";
import { isOwnerEmail } from "@/lib/owners-admin";
import { brandedBody, escapeHtml, sendBrandedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://lmgestionimmobiliere.ca";
const ALLOWED_ORIGINS = [SITE_URL, "http://localhost:3123", "http://localhost:3000"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!authConfigured() || !adminConfigured()) {
    return Response.json({ error: "Service d'authentification non configuré." }, { status: 503 });
  }

  let body: { email?: string; origin?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Courriel invalide." }, { status: 400 });

  const origin = ALLOWED_ORIGINS.includes(body.origin ?? "") ? (body.origin as string) : SITE_URL;

  // On n'envoie qu'aux courriels autorisés — mais on renvoie toujours {ok:true}
  // pour ne pas révéler quels courriels sont des clients.
  const allowed = (await resolveIsAdmin(email)) || (await isOwnerEmail(email).catch(() => false));
  if (!allowed) return Response.json({ ok: true });

  try {
    const link = await adminAuthPrivileged().generateSignInWithEmailLink(email, {
      url: `${origin}/connexion?e=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    });

    // Firebase génère le lien sur *.firebaseapp.com. Un courriel envoyé depuis
    // lmgestionimmobiliere.ca qui pointe vers un AUTRE domaine déclenche les filtres
    // anti-hameçonnage (surtout Outlook) → pourriel. On réécrit donc le lien sur
    // NOTRE domaine en conservant les paramètres (oobCode, mode=signIn, apiKey…).
    // La page /connexion complète la connexion via signInWithEmailLink (le domaine
    // du lien n'importe pas pour cette API, seul le oobCode compte).
    const gen = new URL(link);
    const signInLink = new URL(`${origin}/connexion`);
    gen.searchParams.forEach((v, k) => signInLink.searchParams.set(k, v));
    signInLink.searchParams.set("e", email);
    const ctaUrl = signInLink.toString();

    const html = brandedBody({
      heading: "Votre lien de connexion",
      paragraphs: [
        "Bonjour,",
        "Voici votre accès à l'espace client de LM Gestion Immobilière. Cliquez sur le bouton ci-dessous pour vous connecter — ce lien est valable une seule fois et pour une durée limitée.",
        "Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :",
        `<a href="${ctaUrl}" style="color:#0b0b0c;word-break:break-all;">${escapeHtml(ctaUrl)}</a>`,
        "Vous n'avez pas demandé cette connexion&nbsp;? Vous pouvez simplement ignorer ce courriel.",
      ],
      ctaText: "Se connecter à mon espace",
      ctaUrl,
      preheader: "Votre lien de connexion à l'espace client LM Gestion Immobilière",
    });
    const text = `Bonjour,\n\nVoici votre accès à l'espace client de LM Gestion Immobilière.\nConnectez-vous avec ce lien (valable une seule fois) :\n${ctaUrl}\n\nVous n'avez pas demandé cette connexion ? Ignorez ce courriel.\n\nLM Gestion Immobilière\n${SITE_URL}`;
    // reply_to vers une vraie boîte : renforce la légitimité (pas un no-reply muet).
    await sendBrandedEmail({
      to: email,
      subject: "Votre lien de connexion — LM Gestion Immobilière",
      html,
      text,
      replyTo: "info@lmgestionimmobiliere.ca",
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
