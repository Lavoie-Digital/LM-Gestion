/* ------------------------------------------------------------------ *
 * Contrôle d'accès côté serveur (partagé par les routes API).
 * Vérifie le jeton Firebase et détermine le rôle sans faire confiance au client.
 * ------------------------------------------------------------------ */

import { adminAuth, authConfigured } from "./firebase-admin";

export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "xavier@lavoiedigital.ca")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

export type Identity = { email: string; isAdmin: boolean };

/** Vérifie l'en-tête `Authorization: Bearer <idToken>`. Renvoie null si invalide. */
export async function verifyBearer(request: Request): Promise<Identity | null> {
  if (!authConfigured()) return null;
  const authz = request.headers.get("authorization") ?? "";
  const token = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : "";
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const email = decoded.email?.toLowerCase();
    if (!email) return null;
    return { email, isAdmin: isAdminEmail(email) };
  } catch {
    return null;
  }
}
