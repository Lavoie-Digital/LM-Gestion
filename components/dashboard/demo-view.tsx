"use client";

import { useState } from "react";
import { Building2, DoorOpen, Sparkles, Wallet } from "lucide-react";
import { BUILDINGS, REVENUE_ALLOCATION, REVENUE_SERIES } from "@/lib/data";
import { formatCAD, formatCADCompact } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PropertiesTable, type PropertyRow } from "@/components/dashboard/properties-table";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { BuildingDetail, type DetailUnit } from "@/components/dashboard/building-detail";
import { DocumentsSection, type DocMeta } from "@/components/dashboard/documents";
import { NotesSection, type NoteMeta } from "@/components/dashboard/notes";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Donut, DONUT_SHADES } from "@/components/charts/donut";
import type { NotifItem } from "@/components/dashboard/shell";

const pct1 = (n: number) =>
  `${n.toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const round = (n: number) => Math.round(n).toString();

const DEMO_KPIS = [
  { label: "Revenu locatif mensuel", value: 160900, format: formatCAD, deltaLabel: "+2,1 % vs mois précédent", trend: "up" as const, spark: [141, 146, 149, 153, 157, 159, 161], icon: Wallet },
  { label: "Taux d'occupation", value: 90.8, format: pct1, deltaLabel: "+1,4 pt vs mois précédent", trend: "up" as const, spark: [89.2, 89.6, 90.1, 89.4, 90, 90.5, 90.8], icon: Building2 },
  { label: "Logements vacants", value: 13, format: round, deltaLabel: "2 de moins ce mois-ci", trend: "down" as const, spark: [18, 17, 16, 15, 15, 14, 13], icon: DoorOpen },
  { label: "Revenu dormant · IA", value: 222900, format: formatCAD, deltaLabel: "Potentiel annuel · 13 vacants", trend: "flat" as const, spark: [196, 204, 209, 214, 218, 221, 223], icon: Sparkles },
];

// Notifications simulées (alimentent la cloche via la page démo).
export const DEMO_NOTIFICATIONS: NotifItem[] = [
  { id: "n1", eventType: "payment_failed", label: "Paiement échoué", detail: "3823 Rue Panet · logement 4 · 1 190 $", at: "2026-06-16T09:12:00" },
  { id: "n2", eventType: "unit_vacancy_started", label: "Logement à relouer", detail: "1450 Boul. Talbot · logement 2 · dispo 1 août", at: "2026-06-15T16:40:00" },
  { id: "n3", eventType: "service_request", label: "Demande de service", detail: "Chauffe-eau · 210 Rue Racine", at: "2026-06-15T11:05:00" },
  { id: "n4", eventType: "payment_received", label: "Paiement reçu", detail: "560 Rue Bégin · logement 1 · 1 340 $", at: "2026-06-14T08:30:00" },
  { id: "n5", eventType: "lease_renewed", label: "Bail renouvelé", detail: "88 Rue Price · logement 3", at: "2026-06-13T13:20:00" },
];

const DEMO_DOCS: DocMeta[] = [
  { id: "d1", name: "Bilan-mensuel-juin-2026.pdf", contentType: "application/pdf", size: 284000, uploadedAt: "2026-06-30T15:00:00", url: "#" },
  { id: "d2", name: "Rapport-occupation-T2.pdf", contentType: "application/pdf", size: 176000, uploadedAt: "2026-06-12T10:30:00", url: "#" },
  { id: "d3", name: "Etat-des-comptes-mai.xlsx", contentType: "application/vnd.ms-excel", size: 42000, uploadedAt: "2026-05-31T17:45:00", url: "#" },
];

const DEMO_NOTES: NoteMeta[] = [
  { id: "m1", title: "Bilan de juin", body: "Bonjour, voici le bilan du mois. L'occupation reste stable et deux baux ont été renouvelés. N'hésitez pas si vous avez des questions.", from: "manager", createdAt: "2026-06-30T15:02:00" },
  { id: "m2", title: "", body: "Merci pour le suivi. Est-ce qu'on a une date pour la réparation au 3823 Panet ?", from: "client", createdAt: "2026-06-30T18:20:00" },
];

const TENANTS = ["Marc Tremblay", "Julie Gagnon", "Louis Bergeron", "Sophie Roy", "Éric Fortin", "Camille Simard", "Antoine Côté", "Marie Lévesque", "David Girard", "Nadia Boucher"];
const TYPES = [3.5, 4.5, 5.5, 2.5];

/** Génère des logements plausibles pour un immeuble (pour le panneau de détails). */
function demoUnits(b: (typeof BUILDINGS)[number]): DetailUnit[] {
  const n = Math.min(b.units, 12);
  const rentCents = Math.round((b.monthlyRevenue / Math.max(b.occupied, 1)) * 100);
  const vacants = Math.max(0, Math.min(n, b.units - b.occupied));
  return Array.from({ length: n }, (_, k) => {
    const vacant = k >= n - vacants;
    const type = TYPES[k % TYPES.length];
    const tenant = TENANTS[k % TENANTS.length];
    const slug = tenant
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]+/g, ".")
      .replace(/^\.|\.$/g, "");
    return {
      unitId: `${b.name}-${k + 1}`,
      label: `${k + 1}`,
      unitType: type,
      currentRentCents: vacant ? 0 : Math.round(rentCents * (0.92 + (k % 5) * 0.03)),
      marketPriceCents: Math.round(rentCents * 1.06),
      address: `${b.neighborhood}`,
      tenants: vacant ? "" : tenant,
      tenantsEmails: vacant ? "" : `${slug}@exemple.com`,
      tenantsPhones: vacant ? "" : "(418) 555-0192",
      dateAvailableForRent: vacant ? "2026-08-01T00:00:00" : "",
      markedWontRenew: vacant,
    };
  });
}

export function DemoView() {
  const [selected, setSelected] = useState<(typeof BUILDINGS)[number] | null>(null);

  const rows: PropertyRow[] = BUILDINGS.map((b) => ({
    id: b.name,
    name: b.name,
    neighborhood: b.neighborhood,
    occupied: b.occupied,
    units: b.units,
    occupancy: b.occupancy,
    monthlyRevenue: b.monthlyRevenue,
    spark: b.spark,
  }));

  return (
    <>
      <section id="apercu" className="scroll-mt-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DEMO_KPIS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DocumentsSection docs={DEMO_DOCS} />
        <NotesSection notes={DEMO_NOTES} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertiesTable
            rows={rows}
            updatedLabel="Démonstration"
            onRowClick={(row) => setSelected(BUILDINGS.find((b) => b.name === row.id) ?? null)}
          />
        </div>
        <ActivityFeed />
      </div>

      {selected && (
        <BuildingDetail
          title={selected.name}
          subtitle={selected.neighborhood}
          units={demoUnits(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
