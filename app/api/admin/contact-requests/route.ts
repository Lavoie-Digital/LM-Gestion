/* ------------------------------------------------------------------ *
 * Demandes de contact — zone admin.
 *   GET                 → { requests, unseen }
 *   GET ?count=1        → { unseen } (bulle de notification, léger)
 *   PATCH { id, seen?: true, status?, followUp? }
 *   DELETE { id }       → suppression définitive
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import {
  CONTACT_STATUSES,
  deleteContactRequest,
  listContactRequests,
  unseenContactCount,
  updateContactRequest,
  type ContactStatus,
} from "@/lib/contact-requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return { error: Response.json({ error: "Non authentifié." }, { status: 401 }) };
  if (!id.isAdmin) return { error: Response.json({ error: "Réservé aux admins." }, { status: 403 }) };
  return { id };
}

export async function GET(request: Request) {
  const { id, error } = await requireAdmin(request);
  if (!id) return error;
  try {
    if (new URL(request.url).searchParams.get("count")) {
      return Response.json({ unseen: await unseenContactCount() });
    }
    const requests = await listContactRequests();
    return Response.json({ requests, unseen: requests.filter((r) => !r.seenAt).length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { id, error } = await requireAdmin(request);
  if (!id) return error;
  let body: { id?: string; seen?: boolean; status?: string; followUp?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  if (body.status && !CONTACT_STATUSES.includes(body.status as ContactStatus)) {
    return Response.json({ error: "Statut invalide." }, { status: 400 });
  }
  try {
    await updateContactRequest(body.id, {
      seenBy: body.seen ? id.email : undefined,
      status: body.status as ContactStatus | undefined,
      followUp: typeof body.followUp === "string" ? body.followUp : undefined,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { id, error } = await requireAdmin(request);
  if (!id) return error;
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  try {
    await deleteContactRequest(body.id);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
