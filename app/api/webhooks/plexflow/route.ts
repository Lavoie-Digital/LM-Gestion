import crypto from "node:crypto";
import { cacheInvalidate } from "@/lib/cache";
import { recordWebhook } from "@/lib/webhook-log";
import { adminConfigured } from "@/lib/firebase-admin";
import { persistEvent } from "@/lib/plexflow-store";
import type { PlexflowEvent } from "@/lib/plexflow-events";

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
 * URL à donner à PlexFlow (production) :
 *   https://lmgestionimmobiliere.ca/api/webhooks/plexflow
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

// PlexFlow signe avec un schéma type Stripe dans le header `x-plexflow-signature` :
//   x-plexflow-signature: t=<timestamp>,v1=<hmacSHA256(`${t}.${rawBody}`)>
// Le HMAC est en hexadécimal. On essaie la clé du secret en UTF-8 et, au besoin,
// décodée en base64 (le secret PlexFlow ressemble à du base64).
const PLEXFLOW_SIG_HEADER = "x-plexflow-signature";

function safeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function candidateKeys(secret: string): Array<{ label: string; key: Buffer | string }> {
  const keys: Array<{ label: string; key: Buffer | string }> = [{ label: "utf8", key: secret }];
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(secret)) {
    try {
      keys.push({ label: "base64", key: Buffer.from(secret, "base64") });
    } catch {
      /* ignore */
    }
  }
  return keys;
}

function verifySignature(
  rawBody: string,
  headers: Headers,
  secret: string
): { verified: boolean; matched?: string; scheme?: string } {
  const sig = headers.get(PLEXFLOW_SIG_HEADER);
  if (!sig) return { verified: false };

  // Parse "t=...,v1=..."
  const parts: Record<string, string> = {};
  for (const kv of sig.split(",")) {
    const idx = kv.indexOf("=");
    if (idx > 0) parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  }
  const t = parts["t"];
  const v1 = parts["v1"];

  // Schéma type Stripe : HMAC sur `${t}.${rawBody}`.
  if (t && v1) {
    const signed = `${t}.${rawBody}`;
    for (const { label, key } of candidateKeys(secret)) {
      const hex = crypto.createHmac("sha256", key).update(signed, "utf8").digest("hex");
      if (safeEq(hex, v1)) {
        return { verified: true, matched: PLEXFLOW_SIG_HEADER, scheme: `t.body/${label}` };
      }
    }
    return { verified: false, matched: PLEXFLOW_SIG_HEADER, scheme: "t.body" };
  }

  // Repli : signature brute (hex ou base64) sur le corps seul.
  const clean = sig.replace(/^sha256=/i, "").trim();
  for (const { label, key } of candidateKeys(secret)) {
    const hex = crypto.createHmac("sha256", key).update(rawBody, "utf8").digest("hex");
    const b64 = crypto.createHmac("sha256", key).update(rawBody, "utf8").digest("base64");
    if (safeEq(clean, hex) || safeEq(clean, b64)) {
      return { verified: true, matched: PLEXFLOW_SIG_HEADER, scheme: `body/${label}` };
    }
  }
  return { verified: false, matched: PLEXFLOW_SIG_HEADER };
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
    if (r.scheme) matchedSig = `${r.matched} (${r.scheme})`;
    if (r.verified) {
      console.log(`[plexflow-webhook] ✓ Signature vérifiée (${matchedSig}).`);
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

  // Type d'événement : header `x-plexflow-event` (confirmé), sinon `eventType` du payload.
  const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const eventType =
    request.headers.get("x-plexflow-event") ??
    ([p.eventType, p.event, p.type].find((v) => typeof v === "string") as string | undefined);

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

  // Un événement = un changement dans le parc → on invalide le cache PlexFlow
  // TOUJOURS (même sans Firestore) : le prochain chargement du dashboard relira
  // des données fraîches. C'est ce qui rend le cache long (5 min) sûr.
  cacheInvalidate("plexflow:");

  // Persiste dans Firestore (historique + fil d'activité) si l'Admin SDK est configuré.
  // Ne jamais faire échouer le 200 : PlexFlow réessaierait sur une erreur.
  if (adminConfigured()) {
    const evt: PlexflowEvent = {
      eventId: typeof p.eventId === "string" ? p.eventId : (request.headers.get("x-plexflow-event-id") ?? undefined),
      eventType,
      entityId: typeof p.entityId === "string" ? p.entityId : String(p.entityId ?? "") || undefined,
      timestamp: typeof p.timestamp === "string" ? p.timestamp : undefined,
      data: (p.data && typeof p.data === "object" ? p.data : {}) as Record<string, unknown>,
    };
    try {
      await persistEvent(evt);
    } catch (err) {
      console.error("[plexflow-webhook] ✖ Persistance Firestore échouée :", (err as Error).message);
    }
  } else {
    console.warn("[plexflow-webhook] ⚠ FIREBASE_SERVICE_ACCOUNT absent — événement non persisté (journal mémoire seulement).");
  }

  // PlexFlow attend généralement un 200 rapide pour considérer la livraison OK.
  return Response.json({ received: true });
}
