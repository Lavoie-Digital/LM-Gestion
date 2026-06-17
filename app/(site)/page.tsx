import { Hero } from "@/components/sections/hero";
import { Firme } from "@/components/sections/firme";
import { Stats } from "@/components/sections/stats";
import { ClientSpaceTeaser } from "@/components/sections/client-space-teaser";
import { AiSteps } from "@/components/sections/ai-steps";
import { CTA } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Firme />

      {/* Espace client — preview + AI */}
      <ClientSpaceTeaser />
      <Stats />
      <AiSteps />

      <CTA />
    </>
  );
}
