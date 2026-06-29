import { Activity, BellRing, LineChart, Sparkles } from "lucide-react";
import { AI_SUMMARY, REVENUE_SERIES } from "@/lib/data";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { AreaChart } from "@/components/charts/area-chart";

const FEATURES = [
  { icon: Activity, label: "Données du parc en temps réel" },
  { icon: Sparkles, label: "Analyse IA des logements vacants" },
  { icon: LineChart, label: "Comparables du marché en continu" },
  { icon: BellRing, label: "Activité, paiements et rapports en un coup d'œil" },
];

function DashboardPreview() {
  return (
    <div className="relative rounded-[14px] border border-line-dark bg-ink-2 p-2.5 shadow-[0_50px_120px_-50px_rgba(0,0,0,0.9)]">
      <div className="overflow-hidden rounded-[9px] border border-line-dark bg-noir">
        <div className="flex items-center justify-between border-b border-line-dark px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-paper/25" />
            <span className="size-2 rounded-full bg-paper/15" />
            <span className="size-2 rounded-full bg-paper/10" />
          </div>
          <span className="mono text-[0.55rem] uppercase tracking-[0.18em] text-ash">
            Espace client · Portefeuille Verdure
          </span>
          <span className="inline-flex items-center gap-1.5 text-[0.6rem] text-paper/70">
            <span className="live-dot inline-block size-1.5 rounded-full bg-paper" />
            En direct
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[6px] border border-line-dark p-3.5">
              <p className="mono text-[0.55rem] uppercase tracking-[0.16em] text-ash">
                Revenu mensuel
              </p>
              <p className="mt-2 font-display text-2xl tracking-tight text-paper tabular">160 900 $</p>
              <p className="mt-1 text-[0.65rem] text-paper/55">▲ +2,1 % vs mois précédent</p>
            </div>
            <div className="rounded-[6px] border border-line-dark p-3.5">
              <p className="mono text-[0.55rem] uppercase tracking-[0.16em] text-ash">Occupation</p>
              <p className="mt-2 font-display text-2xl tracking-tight text-paper tabular">90,8 %</p>
              <p className="mt-1 text-[0.65rem] text-paper/55">▲ +1,4 pt · 13 vacants</p>
            </div>
          </div>

          <div className="rounded-[6px] border border-line-dark p-3.5 text-paper">
            <div className="mb-2 flex items-center justify-between">
              <p className="mono text-[0.55rem] uppercase tracking-[0.16em] text-ash">
                Revenus locatifs · 12 mois
              </p>
              <span className="mono text-[0.55rem] text-paper/50">+14,1 %</span>
            </div>
            <AreaChart data={REVENUE_SERIES} height={120} showLabels={false} />
          </div>

          <div className="relative overflow-hidden rounded-[6px] border border-paper/20 bg-paper/[0.04] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.16em] text-paper/80">
                  <Sparkles className="size-3" /> Analyse IA
                </p>
                <p className="mt-2 text-[0.7rem] text-ash">Revenu dormant identifié sur les vacants</p>
                <p className="mt-1 font-display text-xl tracking-tight text-paper tabular">
                  +222 900 $/an
                </p>
              </div>
              <span className="mono shrink-0 rounded-full border border-paper/20 px-2 py-1 text-[0.5rem] uppercase tracking-[0.14em] text-paper/70">
                {AI_SUMMARY.listingsScanned.toLocaleString("fr-CA")} annonces
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Self-contained dark section presenting the client space. Used on the landing page. */
export function ClientSpaceTeaser() {
  return (
    <section className="relative overflow-hidden bg-noir py-24 text-paper md:py-32">
      <div className="grid-faint absolute inset-0 opacity-30" aria-hidden />

      <div className="shell relative grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeader
            dark
            label="Espace client · IA"
            title={
              <>
                Votre parc en temps réel, <span className="italic">augmenté</span> par l'IA.
              </>
            }
            lede="Connectez-vous pour suivre vos revenus, votre occupation et l'activité de chaque immeuble. Notre intelligence artificielle compare vos logements vacants aux annonces comparables du marché pour révéler leur véritable potentiel de revenu."
          />

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Reveal key={f.label} delay={0.05}>
                <li className="flex items-center gap-3 rounded-[2px] border border-line-dark bg-ink-2/40 px-4 py-3.5 text-sm text-paper/85">
                  <f.icon className="size-4 shrink-0 text-paper/70" strokeWidth={1.5} />
                  {f.label}
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink href="/contact" variant="light" size="lg" arrow>
                Demander une démonstration
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <DashboardPreview />
        </Reveal>
      </div>
    </section>
  );
}
