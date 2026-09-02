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
import { brandedBody, sendBrandedEmail } from "@/lib/email";

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

    const html = brandedBody({
      heading: "Votre lien de connexion",
      paragraphs: [
        "Bonjour,",
        "Cliquez sur le bouton ci-dessous pour vous connecter à votre espace client. Ce lien est valable une seule fois et pour une durée limitée.",
        "Si vous n'avez pas demandé cette connexion, vous pouvez ignorer ce courriel.",
      ],
      ctaText: "Se connecter",
      ctaUrl: link,
      preheader: "Votre lien de connexion à l'espace client",
    });
    const text = `Bonjour,\n\nConnectez-vous à votre espace client avec ce lien (valable une fois) :\n${link}\n\nSi vous n'avez pas demandé cette connexion, ignorez ce courriel.\n\nLM Gestion Immobilière`;
    await sendBrandedEmail({ to: email, subject: "Votre lien de connexion — LM Gestion Immobilière", html, text });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
