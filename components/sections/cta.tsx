import Image from "next/image";
import { CLIENT_TEASER_IMAGE } from "@/lib/data";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-noir text-paper">
      <Image
        src={CLIENT_TEASER_IMAGE}
        alt=""
        fill
        sizes="100vw"
        className="img-grayscale object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-noir via-noir/80 to-noir" />
      <div className="grid-faint absolute inset-0 opacity-30" aria-hidden />

      <div className="shell relative flex flex-col items-center py-28 text-center md:py-40">
        <Reveal>
          <span className="kicker text-ash">Parlons de votre patrimoine</span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-7 max-w-4xl text-balance font-display text-[clamp(2.5rem,6.5vw,5.5rem)] font-light leading-[1.0] tracking-[-0.02em]">
            Confiez-nous ce que vous avez <span className="italic">bâti</span>.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-ash">
            Une rencontre confidentielle suffit pour évaluer le potentiel de votre parc et
            vous présenter notre espace client intelligent.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-11 flex flex-col items-center gap-4 sm:flex-row">
            <Magnetic strength={0.4}>
              <ButtonLink href="/contact" variant="light" size="lg">
                Planifier une rencontre
              </ButtonLink>
            </Magnetic>
            <ButtonLink href="/connexion" variant="outline-light" size="lg" arrow>
              Accéder à l'espace client
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
