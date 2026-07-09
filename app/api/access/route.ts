/* ------------------------------------------------------------------ *
 * Vérifie si l'utilisateur connecté a accès à l'espace client.
 * Accès = admin OU courriel associé à un sous-compte (profil client).
 * Le client (auth.tsx) s'appuie là-dessus au lieu d'une liste blanche figée.
 * ------------------------------------------------------------------ */

import { authConfigured } from "@/lib/firebase-admin";
import { verifyBearer } from "@/lib/access";
import { isOwnerEmail } from "@/lib/owners-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authConfigured()) return Response.json({ configured: false, allowed: false, isAdmin: false });

  const id = await verifyBearer(request);
  if (!id) return Response.json({ configured: true, allowed: false, isAdmin: false }, { status: 401 });

  const allowed = id.isAdmin || (await isOwnerEmail(id.email).catch(() => false));
  return Response.json({ configured: true, allowed, isAdmin: id.isAdmin, email: id.email });
}
