/* ------------------------------------------------------------------ *
 * Cron : libère les notes programmées échues et envoie leurs courriels.
 * À appeler périodiquement (Render Cron, cron-job.org…) toutes les ~5-15 min.
 * Protégé par CRON_SECRET (header `x-cron-secret` ou ?secret=).
 * (Aussi déclenché de façon opportuniste à l'ouverture des notes.)
 * ------------------------------------------------------------------ */

import { releaseAndNotifyNotes } from "@/lib/note-mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  return provided === secret;
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!authorized(request)) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    const released = await releaseAndNotifyNotes();
    return Response.json({ ok: true, released });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
