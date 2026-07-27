/* ------------------------------------------------------------------ *
 * Gestion des administrateurs (admin uniquement).
 *   GET    → { envAdmins[], dbAdmins[{id,email}] }
 *   POST   { email } → ajoute un admin (base)
 *   DELETE { email } → retire un admin (base seulement ; les env sont permanents)
 * ------------------------------------------------------------------ */

import { ADMIN_EMAILS, verifyBearer } from "@/lib/access";
import { addDbAdmin, listDbAdmins, removeDbAdmin } from "@/lib/admins";
import { brandedBody, sendBrandedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = "https://lmgestionimmobiliere.ca";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  return Response.json({ envAdmins: ADMIN_EMAILS, dbAdmins: await listDbAdmins() });
}

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Courriel invalide." }, { status: 400 });

  try {
    const created = await addDbAdmin(email);
    // Courriel de bienvenue au nouvel administrateur (uniquement au 1er ajout).
    if (created) {
      const html = brandedBody({
        heading: "Vous avez accès à l'espace de gestion",
        paragraphs: [
          "Bonjour,",
          `Vous venez d'être ajouté comme <strong style="color:#0b0b0c;">administrateur</strong> de l'espace LM Gestion Immobilière.`,
          `Vous pouvez dès maintenant vous connecter avec cette adresse (<strong style="color:#0b0b0c;">${email}</strong>) — via Google ou par lien de connexion, sans mot de passe à retenir.`,
          "Vous aurez accès au tableau de bord complet et à la zone d'administration.",
        ],
        ctaText: "Se connecter",
        ctaUrl: `${SITE_URL}/connexion`,
        preheader: "Votre accès administrateur est actif",
      });
      const text = `Bonjour,\n\nVous avez été ajouté comme administrateur de LM Gestion Immobilière (${email}).\nConnectez-vous (Google ou lien par courriel) : ${SITE_URL}/connexion`;
      await sendBrandedEmail({ to: email, subject: "Votre accès administrateur — LM Gestion Immobilière", html, text }).catch(() => {});
    }
    return Response.json({ ok: true, created });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Courriel manquant." }, { status: 400 });
  // Les admins « permanents » (env) ne peuvent pas être retirés ici.
  if (ADMIN_EMAILS.includes(email)) {
    return Response.json({ error: "Cet admin est permanent (défini par variable d'environnement)." }, { status: 400 });
  }

  try {
    await removeDbAdmin(email);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
