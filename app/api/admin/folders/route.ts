/* ------------------------------------------------------------------ *
 * Dossiers de documents par sous-compte (admin) :
 *   POST   { subaccount, name } → crée un dossier
 *   DELETE { subaccount, name } → supprime (les docs retournent à la racine)
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { createFolder, deleteFolder } from "@/lib/documents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  let body: { subaccount?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const subaccount = (body.subaccount ?? "").trim();
  const name = (body.name ?? "").trim();
  if (!subaccount || !name) return Response.json({ error: "Sous-compte et nom requis." }, { status: 400 });
  try {
    await createFolder(subaccount, name);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  let body: { subaccount?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const subaccount = (body.subaccount ?? "").trim();
  const name = (body.name ?? "").trim();
  if (!subaccount || !name) return Response.json({ error: "Sous-compte et nom requis." }, { status: 400 });
  try {
    await deleteFolder(subaccount, name);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
