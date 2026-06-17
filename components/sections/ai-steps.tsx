import { ScanSearch, Sparkles, TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

const STEPS = [
  {
    icon: ScanSearch,
    index: "01",
    title: "Veille de marché en continu",
    text: "Nous analysons en permanence les annonces comparables du secteur pour cartographier les loyers réels, quartier par quartier.",
  },
  {
    icon: Sparkles,
    index: "02",
    title: "Analyse comparative par l'IA",
    text: "L'intelligence artificielle compare chaque logement vacant aux comparables les plus proches et recommande le juste loyer, avec un indice de confiance.",
  },
  {
    icon: TrendingUp,
    index: "03",
    title: "Potentiel de revenu révélé",
    text: "Vous découvrez en un coup d'œil le revenu dormant de votre parc et le délai de location estimé — pour décider, vite et bien.",
  },
];

/** Light "AI in three steps" section. Used on the landing page. */
export function AiSteps() {
  return (
    <section className="section-y bg-paper">
      <div className="shell">
        <SectionHeader
          index="—"
          label="L'analyse IA en trois temps"
          title={
            <>
              Du <span className="italic">marché</span> à la décision, en un instant.
            </>
          }
          lede="Une lecture du marché transformée en recommandations concrètes pour votre portefeuille."
        />

        <Stagger className="mt-16 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <StaggerItem
              key={s.index}
              className="flex flex-col rounded-[2px] border border-line bg-white p-8"
            >
              <div className="flex items-center justify-between">
                <s.icon className="size-7 text-ink/80" strokeWidth={1.4} />
                <span className="kicker text-smoke">{s.index}</span>
              </div>
              <h3 className="mt-9 font-display text-[1.5rem] leading-tight tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-smoke">{s.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
