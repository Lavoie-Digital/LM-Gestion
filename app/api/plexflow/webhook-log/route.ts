/* ------------------------------------------------------------------ *
 * Lecture du journal des webhooks PlexFlow reçus (zone admin).
 * Alimente la page /admin/webhooks pour inspecter les événements réels
 * (headers + payload + statut de signature).
 * ------------------------------------------------------------------ */

import { clearWebhookLog, getWebhookLog } from "@/lib/webhook-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ entries: getWebhookLog() });
}

export async function DELETE() {
  clearWebhookLog();
  return Response.json({ cleared: true });
}
