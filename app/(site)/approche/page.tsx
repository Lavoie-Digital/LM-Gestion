import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Approach } from "@/components/sections/approach";
import { CTA } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "Approche",
  description:
    "Notre méthode en quatre temps : évaluation, mise en marché, gestion et optimisation pilotée par la donnée et l'IA.",
};

export default function ApprochePage() {
  return (
    <>
      <PageHero
        index="02"
        label="Notre approche"
        title={
          <>
            Une méthode en quatre temps, <span className="italic">éprouvée</span>.
          </>
        }
        intro="Chaque mandat suit le même fil conducteur exigeant — de l'audit initial au pilotage continu de la rentabilité."
      />
      <section className="section-y bg-paper">
        <div className="shell">
          <Approach />
        </div>
      </section>
      <CTA />
    </>
  );
}
