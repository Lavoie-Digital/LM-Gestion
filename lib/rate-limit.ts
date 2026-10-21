/* ------------------------------------------------------------------ *
 * Limiteur de requêtes simple (fenêtre fixe, en mémoire) pour les routes
 * PUBLIQUES : lien de connexion, formulaire de contact, analyse de marché.
 * Empêche l'abus (spam de courriels, facture API gonflée, force brute).
 *
 * NOTE : en mémoire = par instance (même limite que lib/cache.ts). Suffisant
 * pour une instance unique ; passer à Redis si on scale horizontalement.
 * ------------------------------------------------------------------ */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** IP du client (derrière le proxy de l'hébergeur), sinon « unknown ». */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Compte une requête pour `key`. Renvoie `{ ok: false, retryAfter }` si la
 * limite `max` est dépassée dans la fenêtre `windowMs`.
 */
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  // Ménage opportuniste pour ne pas laisser la Map grossir indéfiniment.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > max) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

/** Réponse 429 standard (message en français pour l'interface). */
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "Trop de tentatives. Veuillez réessayer dans quelques minutes." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
