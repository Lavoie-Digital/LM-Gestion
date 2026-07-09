/* ------------------------------------------------------------------ *
 * Liste fusionnée : sous-comptes PlexFlow ↔ profils clients (courriel).
 * Réservé aux admins. Sert la gestion des accès dans /admin.
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { listSubaccountsDetailed } from "@/lib/plexflow-store";
import { listOwners } from "@/lib/owners-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  try {
    const [subs, owners] = await Promise.all([listSubaccountsDetailed(), listOwners()]);
    const byName = new Map(owners.filter((o) => o.plexflowSubaccount).map((o) => [o.plexflowSubaccount as string, o]));

    // Sous-comptes PlexFlow (avec statut d'association).
    const rows = subs.map((s) => {
      const owner = byName.get(s.name);
      return {
        name: s.name,
        unitCount: s.unitCount,
        monthlyRevenueCents: s.monthlyRevenueCents,
        email: owner?.email ?? null,
        ownerId: owner?.id ?? null,
      };
    });

    // Profils orphelins (courriel lié à un sous-compte absent du parc actuel).
    const known = new Set(subs.map((s) => s.name));
    const orphans = owners
      .filter((o) => o.plexflowSubaccount && !known.has(o.plexflowSubaccount))
      .map((o) => ({ name: o.plexflowSubaccount as string, unitCount: 0, monthlyRevenueCents: 0, email: o.email, ownerId: o.id }));

    return Response.json({ subaccounts: [...rows, ...orphans] });
  } catch (err) {
    return Response.json({ error: `PlexFlow/Firestore: ${(err as Error).message}` }, { status: 502 });
  }
}
