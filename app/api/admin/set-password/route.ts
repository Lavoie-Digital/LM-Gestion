/* ------------------------------------------------------------------ *
 * Définit un mot de passe pour un compte client (repli quand le lien de
 * connexion par courriel n'arrive pas — ex. boîtes Hotmail/Outlook qui
 * filtrent). Réservé aux ADMINS.
 *
 * Le mot de passe est TEMPORAIRE : on pose la revendication (custom claim)
 * `mustChangePassword`, ce qui force le client à choisir le sien au 1er login
 * (cf. lib/auth.tsx + /api/auth/password-changed). Un mot de passe générique
 * partagé n'est donc jamais durable.
 * ------------------------------------------------------------------ */

import { adminAuthPrivileged, adminConfigured, authConfigured } from "@/lib/firebase-admin";
import { verifyBearer } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!authConfigured() || !adminConfigured())
    return Response.json({ error: "Service d'authentification non configuré." }, { status: 503 });

  const id = await verifyBearer(request);
  if (!id?.isAdmin) return Response.json({ error: "Accès refusé." }, { status: 403 });

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = (body.password ?? "").trim();
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Courriel invalide." }, { status: 400 });
  if (password.length < 6)
    return Response.json({ error: "Le mot de passe doit contenir au moins 6 caractères." }, { status: 400 });

  const auth = adminAuthPrivileged();
  try {
    let uid: string;
    let created = false;
    let existingClaims: Record<string, unknown> = {};
    try {
      const u = await auth.getUserByEmail(email);
      uid = u.uid;
      existingClaims = (u.customClaims ?? {}) as Record<string, unknown>;
      await auth.updateUser(uid, { password });
    } catch {
      const u = await auth.createUser({ email, password, emailVerified: true });
      uid = u.uid;
      created = true;
    }
    // Force le changement au 1er login (on conserve les autres claims éventuels).
    await auth.setCustomUserClaims(uid, { ...existingClaims, mustChangePassword: true });
    return Response.json({ ok: true, created });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
