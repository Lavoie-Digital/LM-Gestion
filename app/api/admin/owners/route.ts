/* ------------------------------------------------------------------ *
 * Association d'un courriel à un sous-compte PlexFlow (admin).
 *   POST   { subaccount, email }  → lie/écrase
 *   DELETE { subaccount }         → retire l'association
 * L'écriture passe par l'Admin SDK (contourne le bloqueur de pub + les règles).
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { linkSubaccount, unlinkSubaccount } from "@/lib/owners-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { subaccount?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const subaccount = (body.subaccount ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Courriel invalide." }, { status: 400 });

  try {
    await linkSubaccount(subaccount, email);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { subaccount?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const subaccount = (body.subaccount ?? "").trim();
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });

  try {
    await unlinkSubaccount(subaccount);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
