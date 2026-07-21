/* ------------------------------------------------------------------ *
 * Liste fusionnée : sous-comptes PlexFlow ↔ profils clients (courriel).
 * Réservé aux admins. Sert la gestion des accès dans /admin.
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { listSubaccountsDetailed } from "@/lib/plexflow-store";
import { listOwners } from "@/lib/owners-admin";
import { unreadCountsBySubaccount } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  try {
    const [subs, owners, unread] = await Promise.all([
      listSubaccountsDetailed(),
      listOwners(),
      unreadCountsBySubaccount().catch(() => ({} as Record<string, number>)),
    ]);

    // Regroupe les courriels associés par sous-compte (plusieurs possibles).
    const emailsBySub = new Map<string, string[]>();
    for (const o of owners) {
      if (!o.plexflowSubaccount || !o.email) continue;
      const arr = emailsBySub.get(o.plexflowSubaccount) ?? [];
      if (!arr.includes(o.email)) arr.push(o.email);
      emailsBySub.set(o.plexflowSubaccount, arr);
    }

    const rows = subs.map((s) => ({
      name: s.name,
      unitCount: s.unitCount,
      monthlyRevenueCents: s.monthlyRevenueCents,
      emails: (emailsBySub.get(s.name) ?? []).sort(),
      unreadNotes: unread[s.name] ?? 0,
    }));

    // Sous-comptes liés mais absents du parc actuel (courriels orphelins).
    const known = new Set(subs.map((s) => s.name));
    const orphans = [...emailsBySub.entries()]
      .filter(([name]) => !known.has(name))
      .map(([name, emails]) => ({ name, unitCount: 0, monthlyRevenueCents: 0, emails: emails.sort(), unreadNotes: unread[name] ?? 0 }));

    return Response.json({ subaccounts: [...rows, ...orphans] });
  } catch (err) {
    return Response.json({ error: `PlexFlow/Firestore: ${(err as Error).message}` }, { status: 502 });
  }
}
