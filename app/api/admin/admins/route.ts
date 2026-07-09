/* ------------------------------------------------------------------ *
 * Gestion des administrateurs (admin uniquement).
 *   GET    → { envAdmins[], dbAdmins[{id,email}] }
 *   POST   { email } → ajoute un admin (base)
 *   DELETE { email } → retire un admin (base seulement ; les env sont permanents)
 * ------------------------------------------------------------------ */

import { ADMIN_EMAILS, verifyBearer } from "@/lib/access";
import { addDbAdmin, listDbAdmins, removeDbAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    await addDbAdmin(email);
    return Response.json({ ok: true });
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
