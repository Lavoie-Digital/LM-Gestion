/* ------------------------------------------------------------------ *
 * Journal en mémoire des webhooks PlexFlow reçus.
 *
 * Sert à INSPECTER les événements réels depuis la zone admin (au lieu de
 * fouiller les journaux du serveur) → révèle le vrai nom du header de signature
 * et la structure du payload, ce que PlexFlow ne documente pas.
 *
 * ⚠️ En mémoire seulement : le journal se vide à chaque redéploiement, et sur un
 * hébergement multi-instances (Cloud Run / Firebase App Hosting) il n'est pas
 * partagé entre instances. C'est un outil de découverte/débogage ; les vrais
 * événements sont, eux, persistés dans Firestore (`plexflow_events`).
 * ------------------------------------------------------------------ */

export type WebhookLogEntry = {
  at: string; // ISO
  method: "POST" | "SIMULATION";
  eventType?: string;
  verified: boolean | null; // true/false si un secret est configuré, null sinon
  matchedSigHeader?: string; // header de signature détecté (le cas échéant)
  headers: Record<string, string>;
  body: unknown;
};

const MAX = 30;
const entries: WebhookLogEntry[] = [];

export function recordWebhook(entry: WebhookLogEntry): void {
  entries.unshift(entry);
  if (entries.length > MAX) entries.length = MAX;
}

export function getWebhookLog(): WebhookLogEntry[] {
  return entries;
}

export function clearWebhookLog(): void {
  entries.length = 0;
}
