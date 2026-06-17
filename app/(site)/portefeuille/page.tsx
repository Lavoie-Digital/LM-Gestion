import type { Metadata } from "next";
import { HERO_IMAGE } from "@/lib/data";
import { PageHero } from "@/components/site/page-hero";
import { Portfolio } from "@/components/sections/portfolio";
import { CTA } from "@/components/sections/cta";

export const metadata: Metadata = {
  title: "Portefeuille",
  description:
    "Un échantillon des immeubles que LM administre à travers les quartiers les plus convoités du Saguenay — Chicoutimi, Jonquière, La Baie, Arvida.",
};

export default function PortefeuillePage() {
  return (
    <>
      <PageHero
        index="03"
        label="Portefeuille"
        title={
          <>
            Des adresses qui <span className="italic">se distinguent</span>.
          </>
        }
        intro="Un échantillon des immeubles que nous administrons à travers les quartiers les plus convoités du Saguenay."
        image={HERO_IMAGE}
      />
      <section className="section-y bg-paper">
        <div className="shell">
          <Portfolio />
        </div>
      </section>
      <CTA />
    </>
  );
}
