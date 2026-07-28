/* ------------------------------------------------------------------ *
 * Assignation d'un gestionnaire à un sous-compte (admin).
 *   POST { subaccount, manager }  → assigne (manager vide = retire)
 * Le gestionnaire doit être un administrateur (env ou base).
 * ------------------------------------------------------------------ */

import { resolveIsAdmin, verifyBearer } from "@/lib/access";
import { setManager } from "@/lib/managers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { subaccount?: string; manager?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const subaccount = (body.subaccount ?? "").trim();
  const manager = (body.manager ?? "").trim().toLowerCase();
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });

  // Si on assigne quelqu'un, il doit être admin.
  if (manager && !(await resolveIsAdmin(manager))) {
    return Response.json({ error: "Le gestionnaire doit être un administrateur." }, { status: 400 });
  }

  try {
    await setManager(subaccount, manager || null);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
