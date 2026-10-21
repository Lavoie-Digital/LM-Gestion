/* ------------------------------------------------------------------ *
 * Lecture du journal des webhooks PlexFlow reçus (zone admin).
 * Alimente la page /admin/webhooks pour inspecter les événements réels
 * (headers + payload + statut de signature). RÉSERVÉ AUX ADMINS : les
 * payloads contiennent des données du parc.
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { clearWebhookLog, getWebhookLog } from "@/lib/webhook-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  return Response.json({ entries: getWebhookLog() });
}

export async function DELETE(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });
  clearWebhookLog();
  return Response.json({ cleared: true });
}
