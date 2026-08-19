/* ------------------------------------------------------------------ *
 * Cache mémoire simple avec TTL — pour la stratégie « lecture live + cache »
 * des données PlexFlow. Les webhooks invalident les entrées concernées.
 *
 * NOTE : en mémoire = par instance. Le cache repart à zéro à chaque déploiement
 * et n'est pas partagé entre instances multiples (ex. Cloud Run / Firebase App
 * Hosting qui peut lancer plusieurs instances). Suffisant ici (TTL court + les
 * webhooks invalident) ; passer à Redis/DB si on scale fortement.
 * ------------------------------------------------------------------ */

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return e.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Invalide une clé précise, ou toutes les clés commençant par `prefix`. */
export function cacheInvalidate(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Récupère via cache, sinon exécute `loader` et met en cache. */
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  cacheSet(key, value, ttlMs);
  return value;
}
