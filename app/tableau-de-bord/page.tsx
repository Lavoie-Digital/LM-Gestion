"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, DoorOpen, Loader2, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BUILDINGS, REVENUE_ALLOCATION, REVENUE_SERIES } from "@/lib/data";
import { formatCAD, formatCADCompact } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard/shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PropertiesTable } from "@/components/dashboard/properties-table";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Donut, DONUT_SHADES } from "@/components/charts/donut";

const pct1 = (n: number) =>
  `${n.toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

const KPIS = [
  {
    label: "Revenu locatif mensuel",
    value: 160900,
    format: (n: number) => formatCAD(n),
    deltaLabel: "+2,1 % vs mois précédent",
    trend: "up" as const,
    spark: [141, 146, 149, 153, 157, 159, 161],
    icon: Wallet,
  },
  {
    label: "Taux d'occupation",
    value: 90.8,
    format: pct1,
    deltaLabel: "+1,4 pt vs mois précédent",
    trend: "up" as const,
    spark: [89.2, 89.6, 90.1, 89.4, 90.0, 90.5, 90.8],
    icon: Building2,
  },
  {
    label: "Logements vacants",
    value: 13,
    format: (n: number) => Math.round(n).toString(),
    deltaLabel: "2 de moins ce mois-ci",
    trend: "down" as const,
    spark: [18, 17, 16, 15, 15, 14, 13],
    icon: DoorOpen,
  },
  {
    label: "Revenu dormant · IA",
    value: 222900,
    format: (n: number) => formatCAD(n),
    deltaLabel: "Potentiel annuel · 13 vacants",
    trend: "flat" as const,
    spark: [196, 204, 209, 214, 218, 221, 223],
    icon: Sparkles,
  },
];

function RevenueCard() {
  return (
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
  );
}

function AllocationCard() {
  const total = REVENUE_ALLOCATION.reduce((s, d) => s + d.value, 0);
  return (
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
                <span
                  className="size-2.5 shrink-0 rounded-[1px]"
                  style={{ background: `rgba(11,11,12,${DONUT_SHADES[i] ?? 0.12})` }}
                />
                {d.label}
              </span>
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-smoke tabular">
                {Math.round((d.value / total) * 100)} %
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RevenueByBuildingCard() {
  return (
    <div className="rounded-[4px] border border-line bg-white p-6 text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Revenu mensuel par immeuble</h2>
          <p className="mt-1 text-xs text-smoke">Contribution de chaque actif au portefeuille</p>
        </div>
        <span className="mono hidden text-[0.6rem] uppercase tracking-[0.16em] text-smoke sm:block">
          CAD / mois
        </span>
      </div>
      <div className="mt-6">
        <BarChart
          data={BUILDINGS.map((b) => ({ label: b.neighborhood, value: b.monthlyRevenue }))}
          height={230}
          valueFormat={(n) => formatCADCompact(n)}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAllowed, configured } = useAuth();

  // Accès réservé : redirige vers la connexion si non authentifié / non autorisé.
  useEffect(() => {
    if (!loading && (!configured || !user || !isAllowed)) router.replace("/connexion");
  }, [loading, user, isAllowed, configured, router]);

  if (loading || !user || !isAllowed) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 md:space-y-8">
        {/* Demo banner */}
        <div className="flex items-center gap-2.5 rounded-[3px] border border-line bg-paper-2/60 px-4 py-2.5 text-xs text-smoke">
          <span className="size-1.5 shrink-0 rounded-full bg-ink/50" />
          <span>
            <span className="font-medium text-ink">Mode démonstration</span> — les données
            affichées sont fictives et illustrent les capacités de l'espace client.
          </span>
        </div>

        {/* KPIs */}
        <section id="apercu" className="scroll-mt-24">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>
        </section>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <RevenueCard />
          <AllocationCard />
        </div>

        <RevenueByBuildingCard />

        {/* AI analysis — flagship */}
        <AiAnalysis />

        {/* Table + activity */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PropertiesTable />
          </div>
          <ActivityFeed />
        </div>
      </div>
    </DashboardShell>
  );
}
