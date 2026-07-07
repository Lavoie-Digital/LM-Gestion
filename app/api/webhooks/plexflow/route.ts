import crypto from "node:crypto";
import { cacheInvalidate } from "@/lib/cache";
import { recordWebhook } from "@/lib/webhook-log";

/* ------------------------------------------------------------------ *
 * Récepteur de webhooks PlexFlow.
 *
 * Rôle : recevoir les événements PlexFlow (paiement reçu, bail signé, unité
 * mise à jour…), vérifier la signature, puis invalider le cache du parc
 * concerné pour que le propriétaire voie ses données à jour.
 *
 * ⚠️ À COMPLÉTER avec la doc PlexFlow : le NOM du header de signature, le
 * schéma exact (HMAC SHA256 hex/base64 ?), et la STRUCTURE du payload
 * (type d'événement, identifiant du propriétaire/portefeuille). En attendant,
 * cette route LOGUE le payload complet → on découvrira le format réel dès le
 * premier événement reçu (même approche empirique que pour le scraping).
 *
 * URL à donner à PlexFlow (sur Render) :
 *   https://<votre-app>.onrender.com/api/webhooks/plexflow
 * ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Événements webhook documentés par PlexFlow (catégories) :
 *   Contacts prospects : created, modified
 *   Baux : created, renewed
 *   Locataires : confirmed, activated, deactivated, created, deleted, modified
 *   Demandes de service : created, modified, closed, deleted
 *   Notes de demande : created, deleted
 *   Paiements : received, modified, failed, refunded, deleted
 *   Unités : devenue vacante, occupée
 * Le nom exact transmis dans le payload reste à confirmer au 1er événement.
 */

// Réponse 200 à un GET (certains services testent l'URL par un GET de validation).
export async function GET() {
  return Response.json({ ok: true, service: "plexflow-webhook" });
}

// Headers de signature couramment utilisés (on essaie ceux-là).
const SIG_HEADERS = [
  "x-plexflow-signature",
  "x-webhook-signature",
  "x-signature",
  "x-hub-signature-256",
];

function verifySignature(
  rawBody: string,
  headers: Headers,
  secret: string
): { verified: boolean; matched?: string } {
  const matched = SIG_HEADERS.find((h) => headers.get(h));
  const provided = matched ? headers.get(matched) : null;
  if (!provided) return { verified: false };
  const clean = provided.replace(/^sha256=/i, "").trim();
  const hex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const macB64 = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const safeEq = (a: string, b: string) => {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  };
  return { verified: safeEq(clean, hex) || safeEq(clean, macB64), matched };
}

export async function POST(request: Request) {
  const secret = process.env.PLEXFLOW_WEBHOOK_SECRET;
  const rawBody = await request.text();

  // Log des headers reçus — sert à IDENTIFIER le vrai nom du header de signature
  // de PlexFlow (non documenté). On liste tous les headers dont le nom évoque une
  // signature ; sinon la liste complète des clés.
  const allHeaderKeys = [...request.headers.keys()];
  const sigLike = allHeaderKeys.filter((k) =>
    /sign|hmac|hub|hash|digest|secret|token/i.test(k)
  );
  console.log("[plexflow-webhook] Headers reçus :", allHeaderKeys.join(", "));
  if (sigLike.length) {
    console.log(
      "[plexflow-webhook] Headers de type signature :",
      sigLike.map((k) => `${k}=${request.headers.get(k)}`).join(" | ")
    );
  }

  // Vérification de signature — MODE DÉCOUVERTE : tant que le schéma exact de
  // PlexFlow n'est pas confirmé (nom du header + hex/base64), on NE REJETTE PAS
  // sur échec (sinon un mauvais devinage bloquerait tous les vrais événements).
  // → Une fois le header/schéma confirmé dans les logs, remettre le `return 401`.
  let verified: boolean | null = null;
  let matchedSig: string | undefined;
  if (secret) {
    const r = verifySignature(rawBody, request.headers, secret);
    verified = r.verified;
    matchedSig = r.matched;
    if (r.verified) {
      console.log(`[plexflow-webhook] ✓ Signature vérifiée (header ${r.matched}).`);
    } else {
      console.warn(
        "[plexflow-webhook] ⚠ Signature non vérifiée avec les headers/schémas connus " +
          "— accepté en mode découverte. Confirmer le schéma via les headers ci-dessus."
      );
    }
  } else {
    console.warn(
      "[plexflow-webhook] ⚠ PLEXFLOW_WEBHOOK_SECRET absent — mode découverte (payload accepté sans vérif)."
    );
  }

  // Log du payload complet pour découvrir le format réel.
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = rawBody;
  }

  // Repère le type d'événement (le champ exact est à confirmer au 1er payload).
  const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const eventType = [p.event, p.type, p.eventType, p.event_type, p.name].find(
    (v) => typeof v === "string"
  ) as string | undefined;

  console.log(`[plexflow-webhook] ▼ Événement reçu${eventType ? ` : ${eventType}` : " (type inconnu)"}`);
  console.log(JSON.stringify(payload, null, 2).slice(0, 3000));

  // Enregistre l'événement dans le journal en mémoire → inspectable dans /admin/webhooks.
  recordWebhook({
    at: new Date().toISOString(),
    method: request.headers.get("x-simulation") === "1" ? "SIMULATION" : "POST",
    eventType,
    verified,
    matchedSigHeader: matchedSig,
    headers: Object.fromEntries(request.headers.entries()),
    body: payload,
  });

  // TODO (avec la doc PlexFlow) : lire le type d'événement + l'identifiant du
  // propriétaire/portefeuille dans `payload`, puis invalider précisément :
  //   cacheInvalidate(`plexflow:owner:${ownerId}`)
  // En attendant, on invalide tout le cache PlexFlow pour rester cohérent.
  cacheInvalidate("plexflow:");

  // PlexFlow attend généralement un 200 rapide pour considérer la livraison OK.
  return Response.json({ received: true });
}
