/* ------------------------------------------------------------------ *
 * Le client vient de choisir son propre mot de passe (après une connexion
 * avec le mot de passe temporaire fourni par un admin). On retire la
 * revendication `mustChangePassword` sur SON compte — l'appelant ne peut agir
 * que sur lui-même (jeton vérifié).
 * ------------------------------------------------------------------ */

import { adminAuthPrivileged, adminConfigured, authConfigured } from "@/lib/firebase-admin";
import { verifyBearer } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!authConfigured() || !adminConfigured())
    return Response.json({ error: "Service d'authentification non configuré." }, { status: 503 });

  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });

  const auth = adminAuthPrivileged();
  try {
    const u = await auth.getUserByEmail(id.email);
    const claims = (u.customClaims ?? {}) as Record<string, unknown>;
    if ("mustChangePassword" in claims) {
      const { mustChangePassword: _drop, ...rest } = claims;
      void _drop;
      await auth.setCustomUserClaims(u.uid, rest);
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
