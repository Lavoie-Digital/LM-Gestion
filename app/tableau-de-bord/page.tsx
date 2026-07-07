"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, DoorOpen, Layers, Loader2, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BUILDINGS, REVENUE_ALLOCATION, REVENUE_SERIES, type ActivityType } from "@/lib/data";
import { formatCAD, formatCADCompact } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard/shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PropertiesTable, type PropertyRow } from "@/components/dashboard/properties-table";
import { ActivityFeed, type FeedItem } from "@/components/dashboard/activity-feed";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Donut, DONUT_SHADES } from "@/components/charts/donut";

const pct1 = (n: number) =>
  `${n.toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const round = (n: number) => Math.round(n).toString();

/* ------------------------------------------------------------------ *
 * Types renvoyés par /api/dashboard
 * ------------------------------------------------------------------ */
type BuildingAgg = {
  propertyId: string;
  label: string;
  city?: string;
  units: number;
  wontRenew: number;
  monthlyRevenueCents: number;
};
type ActivityApi = { id: string; eventType?: string; label: string; detail: string; at?: string };
type DashResponse = {
  configured: boolean;
  isAdmin?: boolean;
  scope?: "admin" | "owner";
  meta?: { unitCount: number; buildingCount: number; ownerCount: number };
  kpis?: {
    monthlyRevenueCents: number;
    unitCount: number;
    buildingCount: number;
    wontRenewCount: number;
    wontRenewRevenueCents: number;
  };
  byBuilding?: BuildingAgg[];
  owners?: string[];
  activity?: ActivityApi[];
  error?: string;
};

/* ------------------------------------------------------------------ *
 * Vue DÉMO (repli tant qu'il n'y a pas de données réelles)
 * ------------------------------------------------------------------ */
const DEMO_KPIS = [
  { label: "Revenu locatif mensuel", value: 160900, format: formatCAD, deltaLabel: "+2,1 % vs mois précédent", trend: "up" as const, spark: [141, 146, 149, 153, 157, 159, 161], icon: Wallet },
  { label: "Taux d'occupation", value: 90.8, format: pct1, deltaLabel: "+1,4 pt vs mois précédent", trend: "up" as const, spark: [89.2, 89.6, 90.1, 89.4, 90, 90.5, 90.8], icon: Building2 },
  { label: "Logements vacants", value: 13, format: round, deltaLabel: "2 de moins ce mois-ci", trend: "down" as const, spark: [18, 17, 16, 15, 15, 14, 13], icon: DoorOpen },
  { label: "Revenu dormant · IA", value: 222900, format: formatCAD, deltaLabel: "Potentiel annuel · 13 vacants", trend: "flat" as const, spark: [196, 204, 209, 214, 218, 221, 223], icon: Sparkles },
];

function DemoView() {
  return (
    <>
      <section id="apercu" className="scroll-mt-24">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DEMO_KPIS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[4px] border border-line bg-white p-6 text-ink lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-tight">Revenus locatifs</h2>
              <p className="mt-1 text-xs text-smoke">12 derniers mois · perçus</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl tracking-tight tabular">160 900 $</p>
              <p className="mt-0.5 text-xs text-smoke">▲ +14,1 % sur 12 mois</p>
            </div>
          </div>
          <div className="mt-6">
            <AreaChart data={REVENUE_SERIES} height={220} />
          </div>
        </div>

        <div className="flex flex-col rounded-[4px] border border-line bg-white p-6 text-ink">
          <h2 className="font-display text-xl tracking-tight">Répartition des revenus</h2>
          <p className="mt-1 text-xs text-smoke">Par catégorie d'actif</p>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:gap-4 lg:flex-col lg:items-center xl:flex-row">
            <Donut
              data={REVENUE_ALLOCATION}
              size={176}
              thickness={20}
              className="shrink-0"
              center={
                <>
                  <span className="font-display text-2xl leading-none tracking-tight tabular">161 k$</span>
                  <span className="mt-1 text-[0.65rem] text-smoke">mensuel</span>
                </>
              }
            />
            <ul className="w-full space-y-2.5">
              {REVENUE_ALLOCATION.map((d, i) => (
                <li key={d.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2.5 text-ink/80">
                    <span className="size-2.5 shrink-0 rounded-[1px]" style={{ background: `rgba(11,11,12,${DONUT_SHADES[i] ?? 0.12})` }} />
                    {d.label}
                  </span>
                  <span className="font-[family-name:var(--font-jetbrains)] text-xs text-smoke tabular">
                    {Math.round((d.value / REVENUE_ALLOCATION.reduce((s, x) => s + x.value, 0)) * 100)} %
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-[4px] border border-line bg-white p-6 text-ink">
        <h2 className="font-display text-xl tracking-tight">Revenu mensuel par immeuble</h2>
        <p className="mt-1 text-xs text-smoke">Contribution de chaque actif au portefeuille</p>
        <div className="mt-6">
          <BarChart data={BUILDINGS.map((b) => ({ label: b.neighborhood, value: b.monthlyRevenue }))} height={230} valueFormat={(n) => formatCADCompact(n)} />
        </div>
      </div>

      <AiAnalysis />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertiesTable />
        </div>
        <ActivityFeed />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Vue RÉELLE (données PlexFlow)
 * ------------------------------------------------------------------ */
function feedType(eventType?: string): ActivityType {
  const t = (eventType ?? "").toLowerCase();
  if (t.includes("payment")) return "payment";
  if (t.includes("lease")) return "lease";
  if (t.includes("service_request")) return "maintenance";
  if (t.includes("vacancy") || t.includes("vacant")) return "notice";
  if (t.includes("tenant")) return "visit";
  return "inspection";
}
function shortTime(at?: string): string {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function LiveView({ data }: { data: DashResponse }) {
  const k = data.kpis!;
  const byBuilding = data.byBuilding ?? [];
  const cad = (cents: number) => formatCAD(Math.round(cents / 100));

  const kpis = [
    { label: "Revenu locatif mensuel", value: Math.round(k.monthlyRevenueCents / 100), format: formatCAD, deltaLabel: "Rôle des loyers · temps réel", trend: "flat" as const, icon: Wallet },
    { label: "Logements gérés", value: k.unitCount, format: round, deltaLabel: data.isAdmin ? "Tout le parc" : "Votre parc", trend: "flat" as const, icon: Building2 },
    { label: "Immeubles", value: k.buildingCount, format: round, deltaLabel: `${data.meta?.ownerCount ?? 0} propriétaire(s)`, trend: "flat" as const, icon: Layers },
    { label: "Baux à renouveler", value: k.wontRenewCount, format: round, deltaLabel: `${cad(k.wontRenewRevenueCents)} en jeu`, trend: "flat" as const, icon: DoorOpen },
  ];

  const rows: PropertyRow[] = byBuilding.map((b) => {
    const occupied = b.units - b.wontRenew;
    return {
      name: b.label,
      neighborhood: b.city ?? `Immeuble ${b.propertyId}`,
      occupied,
      units: b.units,
      occupancy: b.units ? (occupied / b.units) * 100 : 0,
      monthlyRevenue: Math.round(b.monthlyRevenueCents / 100),
    };
  });

  const activity: FeedItem[] = (data.activity ?? []).map((a) => ({
    type: feedType(a.eventType),
    title: a.label,
    detail: a.detail,
    time: shortTime(a.at),
  }));

  return (
    <>
      <section id="apercu" className="scroll-mt-24">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <div className="rounded-[4px] border border-line bg-white p-6 text-ink">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight">Revenu mensuel par immeuble</h2>
            <p className="mt-1 text-xs text-smoke">Top {Math.min(byBuilding.length, 10)} · loyers PlexFlow</p>
          </div>
          <span className="mono hidden text-[0.6rem] uppercase tracking-[0.16em] text-smoke sm:block">CAD / mois</span>
        </div>
        <div className="mt-6">
          <BarChart
            data={byBuilding.slice(0, 10).map((b) => ({ label: b.label.replace(/^\d+\s*/, "").slice(0, 18), value: Math.round(b.monthlyRevenueCents / 100) }))}
            height={230}
            valueFormat={(n) => formatCADCompact(n)}
          />
        </div>
      </div>

      <AiAnalysis />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertiesTable rows={rows} updatedLabel="Source · PlexFlow" />
        </div>
        <ActivityFeed items={activity} emptyLabel="Les événements PlexFlow (paiements, baux, vacances…) apparaîtront ici en temps réel." />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAllowed, configured } = useAuth();
  const [data, setData] = useState<DashResponse | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!configured || !user || !isAllowed)) router.replace("/connexion");
  }, [loading, user, isAllowed, configured, router]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      setData(await res.json());
    } catch {
      setData({ configured: false });
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading || !user || !isAllowed) return;
    load();
    const id = setInterval(load, 60_000); // rafraîchissement automatique
    return () => clearInterval(id);
  }, [loading, user, isAllowed, load]);

  if (loading || !user || !isAllowed) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const hasReal = Boolean(data?.configured && (data?.meta?.unitCount ?? 0) > 0);

  // Message du bandeau selon l'état.
  let banner: string | null = null;
  if (!hasReal) {
    if (fetching && !data) banner = "Chargement des données PlexFlow…";
    else if (!data?.configured) banner = "Connexion à PlexFlow en cours — données de démonstration.";
    else if (data?.error) banner = "Données PlexFlow momentanément indisponibles — démonstration.";
    else if (data?.scope === "owner") banner = "Aucun parc n'est encore lié à votre compte — démonstration.";
    else banner = "Aucune donnée PlexFlow pour l'instant — démonstration.";
  }

  return (
    <DashboardShell live={hasReal}>
      <div className="space-y-6 md:space-y-8">
        {banner && (
          <div className="flex items-center gap-2.5 rounded-[3px] border border-line bg-paper-2/60 px-4 py-2.5 text-xs text-smoke">
            <span className="size-1.5 shrink-0 rounded-full bg-ink/50" />
            <span>{banner}</span>
          </div>
        )}
        {hasReal && data ? <LiveView data={data} /> : <DemoView />}
      </div>
    </DashboardShell>
  );
}
