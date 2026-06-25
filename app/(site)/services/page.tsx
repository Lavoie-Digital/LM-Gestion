import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Services } from "@/components/sections/services";
import { CTA } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Service clé en main, optimisation des revenus par l'IA, entretien et travaux, service de location, et consultation en gestion immobilière au Saguenay.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        index="01"
        label="Services"
        title={
          <>
            Une gestion <span className="italic">complète</span>, sans la moindre
            approximation.
          </>
        }
        intro="De la perception des loyers au conseil en investissement, chaque volet de votre parc est pris en charge par une équipe dédiée — et augmenté par la donnée."
      />
      <section className="section-y bg-paper">
        <div className="shell">
          <Services />
        </div>
      </section>
      <CTA />
    </>
  );
}
