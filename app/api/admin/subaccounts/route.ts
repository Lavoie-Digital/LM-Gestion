/* ------------------------------------------------------------------ *
 * Liste fusionnée : sous-comptes PlexFlow ↔ profils clients (courriel).
 * Réservé aux admins. Sert la gestion des accès dans /admin.
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { listSubaccountsDetailed } from "@/lib/plexflow-store";
import { listOwners } from "@/lib/owners-admin";
import { unreadCountsBySubaccount } from "@/lib/notes";
import { listManagers } from "@/lib/managers";
import { listManualSubaccounts } from "@/lib/manual-subaccounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  try {
    const [subs, owners, unread, managers, manual] = await Promise.all([
      listSubaccountsDetailed(),
      listOwners(),
      unreadCountsBySubaccount().catch(() => ({} as Record<string, number>)),
      listManagers().catch(() => ({} as Record<string, string>)),
      listManualSubaccounts().catch(() => [] as string[]),
    ]);

    // Regroupe les courriels associés par sous-compte (plusieurs possibles).
    const emailsBySub = new Map<string, string[]>();
    for (const o of owners) {
      if (!o.plexflowSubaccount || !o.email) continue;
      const arr = emailsBySub.get(o.plexflowSubaccount) ?? [];
      if (!arr.includes(o.email)) arr.push(o.email);
      emailsBySub.set(o.plexflowSubaccount, arr);
    }

    // Clients détectés par l'API (avec unités).
    const known = new Set(subs.map((s) => s.name));
    const manualSet = new Set(manual);
    const rows = subs.map((s) => ({
      name: s.name,
      unitCount: s.unitCount,
      monthlyRevenueCents: s.monthlyRevenueCents,
      emails: (emailsBySub.get(s.name) ?? []).sort(),
      unreadNotes: unread[s.name] ?? 0,
      manager: managers[s.name] ?? null,
      manual: false,
    }));

    // Clients SANS unité dans l'API : ajoutés manuellement, ou liés par courriel,
    // ou avec un gestionnaire assigné → on les affiche quand même (unitCount 0).
    const extraNames = new Set<string>([...manualSet, ...emailsBySub.keys(), ...Object.keys(managers)]);
    const extras = [...extraNames]
      .filter((name) => !known.has(name))
      .map((name) => ({
        name,
        unitCount: 0,
        monthlyRevenueCents: 0,
        emails: (emailsBySub.get(name) ?? []).sort(),
        unreadNotes: unread[name] ?? 0,
        manager: managers[name] ?? null,
        manual: manualSet.has(name),
      }));

    const all = [...rows, ...extras].sort((a, b) => a.name.localeCompare(b.name));
    return Response.json({ subaccounts: all });
  } catch (err) {
    return Response.json({ error: `PlexFlow/Firestore: ${(err as Error).message}` }, { status: 502 });
  }
}
