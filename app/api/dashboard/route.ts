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

import { authConfigured } from "@/lib/firebase-admin";
import { verifyBearer } from "@/lib/access";
import { subaccountsForOwnerEmail } from "@/lib/owners-admin";
import { getPortfolio, getSnapshots, listSubaccounts, writeSnapshotIfNeeded } from "@/lib/plexflow-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authConfigured()) {
    return Response.json({ configured: false }, { status: 200 });
  }

  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Jeton manquant ou invalide." }, { status: 401 });
  const { email, isAdmin } = id;

  // « Voir en tant que » : réservé à l'admin, pour vérifier le périmètre d'un
  // propriétaire pendant les tests. Ignoré (sécurité) pour un non-admin.
  const viewAs = new URL(request.url).searchParams.get("viewAs")?.trim() || "";
  const impersonating = isAdmin && viewAs;

  const subaccounts = isAdmin
    ? impersonating
      ? [viewAs]
      : null
    : await subaccountsForOwnerEmail(email);

  // Accès : admin, ou propriétaire ayant au moins un sous-compte lié.
  const allowed = isAdmin || (subaccounts?.length ?? 0) > 0;

  try {
    const portfolio = await getPortfolio(subaccounts);
    // Capture l'instantané du jour (une fois/jour) puis renvoie l'historique.
    await writeSnapshotIfNeeded(subaccounts, portfolio.kpis).catch(() => {});
    const history = await getSnapshots(subaccounts);
    // Liste complète des sous-comptes pour le sélecteur admin.
    const allOwners = isAdmin ? await listSubaccounts().catch(() => []) : [];
    return Response.json({
      configured: true,
      allowed,
      isAdmin,
      email,
      viewingAs: impersonating ? viewAs : null,
      allOwners,
      ...portfolio,
      history,
    });
  } catch (err) {
    return Response.json(
      { configured: true, allowed, isAdmin, email, error: `PlexFlow: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
