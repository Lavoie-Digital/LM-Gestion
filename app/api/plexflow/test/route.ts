/* ------------------------------------------------------------------ *
 * Testeur d'API PlexFlow (zone admin) — sert à DÉCOUVRIR l'URL de base et
 * les endpoints, puisque PlexFlow ne documente pas l'URL de base.
 *
 * SÉCURITÉ : la clé PLEXFLOW_API_KEY (serveur) n'est envoyée QU'aux domaines
 * *.plexflow.ca — jamais à une URL arbitraire (sinon la clé fuiterait vers un
 * serveur tiers). Route à usage admin/développement.
 * ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isPlexflowHost(fullUrl: string): boolean {
  try {
    const h = new URL(fullUrl).hostname.toLowerCase();
    return (
      h === "plexflow.ca" ||
      h.endsWith(".plexflow.ca") ||
      h.endsWith(".plexflow.io") ||
      h.endsWith(".plexflow.com")
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const key = process.env.PLEXFLOW_API_KEY;
  if (!key) {
    return Response.json({ error: "PLEXFLOW_API_KEY manquante dans .env." }, { status: 503 });
  }

  let body: { baseUrl?: string; path?: string; authStyle?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const base = (body.baseUrl ?? "").trim().replace(/\/$/, "");
  const path = (body.path ?? "").trim().replace(/^\//, "");
  const full = path ? `${base}/${path}` : base;

  if (!isPlexflowHost(full)) {
    return Response.json(
      { error: "URL refusée — seuls les domaines *.plexflow.ca sont autorisés (protection de la clé API)." },
      { status: 400 }
    );
  }

  const headers: Record<string, string> =
    body.authStyle === "x-api-key"
      ? { "X-API-Key": key, Accept: "application/json" }
      : { Authorization: `Bearer ${key}`, Accept: "application/json" };

  try {
    const res = await fetch(full, { headers, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    return Response.json({
      requestedUrl: full,
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get("content-type"),
      body: text.slice(0, 6000),
    });
  } catch (err) {
    return Response.json(
      { requestedUrl: full, error: `Échec réseau : ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
