/* ------------------------------------------------------------------ *
 * API du tableau de bord — données réelles du parc (PlexFlow REST + webhooks).
 *
 * Sécurité : le client envoie son jeton Firebase (Authorization: Bearer <idToken>),
 * vérifié ici côté serveur (verifyIdToken — projectId suffit, pas de compte de
 * service requis). Le périmètre est déterminé serveur :
 *   - admin (ADMIN_EMAILS) → tout le parc ;
 *   - propriétaire → uniquement ses sous-comptes PlexFlow (owner.plexflowSubaccount).
 * Passer par cette API (au lieu de lire côté client) sécurise le filtrage ET
 * contourne les bloqueurs qui coupent firestore.googleapis.com.
 * ------------------------------------------------------------------ */

import { adminAuth, adminConfigured, adminDb, authConfigured } from "@/lib/firebase-admin";
import { getPortfolio, getSnapshots, listSubaccounts, writeSnapshotIfNeeded } from "@/lib/plexflow-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "xavier@lavoiedigital.ca")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Sous-comptes PlexFlow (noms) liés au propriétaire via son profil Firestore. */
async function subaccountsForOwner(email: string): Promise<string[]> {
  if (!adminConfigured()) return []; // mapping propriétaire nécessite Firestore
  const snap = await adminDb().collection("owners").where("email", "==", email).limit(5).get();
  const names = new Set<string>();
  for (const doc of snap.docs) {
    const v = doc.get("plexflowSubaccount");
    if (typeof v === "string" && v.trim()) names.add(v.trim());
    if (Array.isArray(v)) for (const s of v) if (typeof s === "string" && s.trim()) names.add(s.trim());
  }
  return [...names];
}

export async function GET(request: Request) {
  if (!authConfigured()) {
    return Response.json({ configured: false }, { status: 200 });
  }

  const authz = request.headers.get("authorization") ?? "";
  const token = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : "";
  if (!token) return Response.json({ error: "Jeton manquant." }, { status: 401 });

  let email: string | undefined;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    email = decoded.email?.toLowerCase();
  } catch {
    return Response.json({ error: "Jeton invalide." }, { status: 401 });
  }
  if (!email) return Response.json({ error: "Compte sans courriel." }, { status: 403 });

  const isAdmin = ADMIN_EMAILS.includes(email);

  // « Voir en tant que » : réservé à l'admin, pour vérifier le périmètre d'un
  // propriétaire pendant les tests. Ignoré (sécurité) pour un non-admin.
  const viewAs = new URL(request.url).searchParams.get("viewAs")?.trim() || "";
  const impersonating = isAdmin && viewAs;

  const subaccounts = isAdmin
    ? impersonating
      ? [viewAs]
      : null
    : await subaccountsForOwner(email);

  try {
    const portfolio = await getPortfolio(subaccounts);
    // Capture l'instantané du jour (une fois/jour) puis renvoie l'historique.
    await writeSnapshotIfNeeded(subaccounts, portfolio.kpis).catch(() => {});
    const history = await getSnapshots(subaccounts);
    // Liste complète des sous-comptes pour le sélecteur admin.
    const allOwners = isAdmin ? await listSubaccounts().catch(() => []) : [];
    return Response.json({
      configured: true,
      isAdmin,
      email,
      viewingAs: impersonating ? viewAs : null,
      allOwners,
      ...portfolio,
      history,
    });
  } catch (err) {
    return Response.json(
      { configured: true, isAdmin, email, error: `PlexFlow: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
