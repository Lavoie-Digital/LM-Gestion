/* ------------------------------------------------------------------ *
 * Journal en mémoire des webhooks PlexFlow reçus.
 *
 * Sert à INSPECTER les événements réels depuis la zone admin (au lieu de
 * fouiller les logs Render) → révèle le vrai nom du header de signature et la
 * structure du payload, ce que PlexFlow ne documente pas.
 *
 * ⚠️ En mémoire seulement : le journal se vide à chaque redéploiement Render
 * (process redémarré). Suffisant pour la phase de découverte ; une persistance
 * Firestore viendra avec le branchement complet.
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
