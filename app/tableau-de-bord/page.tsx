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
import { BuildingDetail } from "@/components/dashboard/building-detail";
import { DocumentsSection, type DocMeta } from "@/components/dashboard/documents";
import { NotesSection, type NoteMeta } from "@/components/dashboard/notes";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Donut, DONUT_SHADES } from "@/components/charts/donut";

const pct1 = (n: number) =>
  `${n.toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const round = (n: number) => Math.round(n).toString();

/** Initiales à partir d'un nom ou d'un courriel. */
function initialsOf(s: string): string {
  if (!s) return "·";
  if (s.includes("@")) return s.split("@")[0].slice(0, 2).toUpperCase();
  const words = s.split(/[\s.]+/).filter((w) => /[A-Za-zÀ-ÿ]/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? s).slice(0, 2).toUpperCase();
}

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
type UnitRow = {
  unitId: string;
  propertyId: string;
  label: string;
  unitType?: string | number;
  currentRentCents: number;
  marketPriceCents?: number | null;
  address?: string;
  tenants?: string;
  tenantsEmails?: string;
  tenantsPhones?: string;
  dateAvailableForRent?: string;
  markedWontRenew: boolean;
};
type ActivityApi = { id: string; eventType?: string; label: string; detail: string; at?: string };
type SnapshotApi = {
  date: string;
  monthlyRevenueCents: number;
  unitCount: number;
  buildingCount: number;
  wontRenewCount: number;
};
type DashResponse = {
  configured: boolean;
  email?: string;
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
  units?: UnitRow[];
  owners?: string[];
  allOwners?: string[];
  viewingAs?: string | null;
  activity?: ActivityApi[];
  history?: SnapshotApi[];
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

function LiveView({
  data,
  docs,
  notes,
  viewAs,
  onViewAsChange,
}: {
  data: DashResponse;
  docs: DocMeta[];
  notes: NoteMeta[];
  viewAs: string;
  onViewAsChange: (v: string) => void;
}) {
  const k = data.kpis!;
  const byBuilding = data.byBuilding ?? [];
  const allUnits = data.units ?? [];
  const cad = (cents: number) => formatCAD(Math.round(cents / 100));
  const [selected, setSelected] = useState<BuildingAgg | null>(null);

  // Historique (croissant). Deltas & sparklines dès qu'on a ≥ 2 points.
  const hist = data.history ?? [];
  const hasHist = hist.length >= 2;
  const prev = hasHist ? hist[hist.length - 2] : undefined;
  const spark = (pick: (s: SnapshotApi) => number) => (hasHist ? hist.slice(-14).map(pick) : undefined);

  const delta = (curr: number, before?: number): { label: string; trend: "up" | "down" | "flat" } => {
    if (before === undefined || before === 0) return { label: "Depuis la connexion PlexFlow", trend: "flat" };
    const diff = curr - before;
    if (diff === 0) return { label: "Stable depuis hier", trend: "flat" };
    const pct = (diff / before) * 100;
    const sign = diff > 0 ? "+" : "−";
    return {
      label: `${sign}${Math.abs(pct).toLocaleString("fr-CA", { maximumFractionDigits: 1 })} % depuis hier`,
      trend: diff > 0 ? "up" : "down",
    };
  };

  const revD = delta(k.monthlyRevenueCents, prev?.monthlyRevenueCents);
  const unitD = delta(k.unitCount, prev?.unitCount);

  const kpis = [
    { label: "Revenu locatif mensuel", value: Math.round(k.monthlyRevenueCents / 100), format: formatCAD, deltaLabel: revD.label, trend: revD.trend, spark: spark((s) => Math.round(s.monthlyRevenueCents / 100)), icon: Wallet },
    { label: "Logements gérés", value: k.unitCount, format: round, deltaLabel: hasHist ? unitD.label : data.isAdmin ? "Tout le parc" : "Votre parc", trend: unitD.trend, spark: spark((s) => s.unitCount), icon: Building2 },
    { label: "Immeubles", value: k.buildingCount, format: round, deltaLabel: `${data.meta?.ownerCount ?? 0} propriétaire(s)`, trend: "flat" as const, spark: spark((s) => s.buildingCount), icon: Layers },
    { label: "Baux à renouveler", value: k.wontRenewCount, format: round, deltaLabel: `${cad(k.wontRenewRevenueCents)} en jeu`, trend: "flat" as const, spark: spark((s) => s.wontRenewCount), icon: DoorOpen },
  ];

  const monthLabel = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
  const revenueSeries = hist.map((s) => ({ month: monthLabel(s.date), value: Math.round(s.monthlyRevenueCents / 100) }));
  const revFirst = hist[0]?.monthlyRevenueCents ?? 0;
  const revLast = hist[hist.length - 1]?.monthlyRevenueCents ?? 0;
  const revGrowthPct = revFirst ? ((revLast - revFirst) / revFirst) * 100 : 0;

  const rows: PropertyRow[] = byBuilding.map((b) => {
    const occupied = b.units - b.wontRenew;
    return {
      id: b.propertyId,
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
      {data.isAdmin && (data.allOwners?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-[3px] border border-line bg-white px-4 py-3">
          <span className="kicker text-smoke">Admin · Voir en tant que</span>
          <select
            value={viewAs}
            onChange={(e) => onViewAsChange(e.target.value)}
            className="h-9 min-w-[16rem] max-w-full rounded-[2px] border border-line bg-white px-2.5 text-sm text-ink outline-none focus:border-ink"
          >
            <option value="">Tous les propriétaires (admin)</option>
            {data.allOwners!.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {data.viewingAs && (
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink">
              Vue propriétaire : {data.viewingAs}
            </span>
          )}
        </div>
      )}

      <section id="apercu" className="scroll-mt-24">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Évolution des revenus — dès qu'on a ≥ 2 instantanés */}
      {hasHist ? (
        <div className="rounded-[4px] border border-line bg-white p-6 text-ink">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-tight">Évolution des revenus locatifs</h2>
              <p className="mt-1 text-xs text-smoke">{hist.length} jours suivis · loyers PlexFlow</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl tracking-tight tabular">{cad(revLast)}</p>
              <p className="mt-0.5 text-xs text-smoke">
                {revGrowthPct >= 0 ? "▲ +" : "▼ "}
                {Math.abs(revGrowthPct).toLocaleString("fr-CA", { maximumFractionDigits: 1 })} % depuis le début du suivi
              </p>
            </div>
          </div>
          <div className="mt-6">
            <AreaChart data={revenueSeries} height={220} />
          </div>
        </div>
      ) : (
        <div className="rounded-[4px] border border-dashed border-line bg-paper-2/40 p-6 text-ink">
          <h2 className="font-display text-xl tracking-tight">Évolution des revenus locatifs</h2>
          <p className="mt-2 max-w-xl text-sm text-smoke">
            La courbe de tendance se construit à partir d'aujourd'hui : un instantané est
            capturé chaque jour. Elle apparaîtra dès le deuxième jour de suivi.
          </p>
        </div>
      )}

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
          <PropertiesTable
            rows={rows}
            updatedLabel="Source · PlexFlow"
            onRowClick={(row) => setSelected(byBuilding.find((b) => b.propertyId === row.id) ?? null)}
          />
        </div>
        <ActivityFeed items={activity} emptyLabel="Les événements PlexFlow (paiements, baux, vacances…) apparaîtront ici en temps réel." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DocumentsSection docs={docs} />
        <NotesSection notes={notes} />
      </div>

      {selected && (
        <BuildingDetail
          title={selected.label}
          subtitle={selected.city}
          units={allUnits.filter((u) => u.propertyId === selected.propertyId)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAllowed, isAdmin, configured } = useAuth();
  const [data, setData] = useState<DashResponse | null>(null);
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [fetching, setFetching] = useState(true);
  const [viewAs, setViewAs] = useState(""); // admin : voir en tant que ce sous-compte

  useEffect(() => {
    if (!loading && (!configured || !user || !isAllowed)) router.replace("/connexion");
  }, [loading, user, isAllowed, configured, router]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const qs = viewAs ? `?viewAs=${encodeURIComponent(viewAs)}` : "";
      const [dashRes, docsRes, notesRes] = await Promise.all([
        fetch(`/api/dashboard${qs}`, { headers, cache: "no-store" }),
        fetch(`/api/documents${qs}`, { headers, cache: "no-store" }),
        fetch(`/api/notes${qs}`, { headers, cache: "no-store" }),
      ]);
      setData(await dashRes.json());
      const dj = await docsRes.json().catch(() => ({ documents: [] }));
      setDocs(Array.isArray(dj.documents) ? dj.documents : []);
      const nj = await notesRes.json().catch(() => ({ notes: [] }));
      setNotes(Array.isArray(nj.notes) ? nj.notes : []);
    } catch {
      setData({ configured: false });
    } finally {
      setFetching(false);
    }
  }, [user, viewAs]);

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

  const notifications = (data?.activity ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    detail: a.detail,
    at: a.at,
    eventType: a.eventType,
  }));

  // Identité affichée (carte latérale + pastille) : le client connecté.
  const email = data?.email ?? user?.email ?? "";
  const asAdmin = data?.isAdmin ?? isAdmin;
  let idName: string;
  let idSecondary: string | undefined;
  if (data?.viewingAs) {
    idName = data.viewingAs;
    idSecondary = "Aperçu propriétaire";
  } else if (asAdmin) {
    idName = "Administration";
    idSecondary = email;
  } else if (data?.owners && data.owners.length) {
    idName = data.owners.join(" · ");
    idSecondary = email;
  } else {
    idName = email || "Espace client";
    idSecondary = undefined;
  }
  const identity = {
    name: idName,
    secondary: idSecondary,
    initials: initialsOf(data?.viewingAs || data?.owners?.[0] || (asAdmin ? "Administration" : email)),
  };

  return (
    <DashboardShell live={hasReal} notifications={notifications} identity={identity}>
      <div className="space-y-6 md:space-y-8">
        {banner && (
          <div className="flex items-center gap-2.5 rounded-[3px] border border-line bg-paper-2/60 px-4 py-2.5 text-xs text-smoke">
            <span className="size-1.5 shrink-0 rounded-full bg-ink/50" />
            <span>{banner}</span>
          </div>
        )}
        {hasReal && data ? (
          <LiveView data={data} docs={docs} notes={notes} viewAs={viewAs} onViewAsChange={setViewAs} />
        ) : (
          <DemoView />
        )}
      </div>
    </DashboardShell>
  );
}
