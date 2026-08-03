/* ------------------------------------------------------------------ *
 * Ajout manuel d'un client (sous-compte) — admin.
 *   POST   { name } → ajoute un client à afficher (même sans unité)
 *   DELETE { name } → retire l'ajout manuel
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { addManualSubaccount, removeManualSubaccount } from "@/lib/manual-subaccounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "Nom du client requis." }, { status: 400 });
  try {
    await addManualSubaccount(name);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "Nom requis." }, { status: 400 });
  try {
    await removeManualSubaccount(name);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
