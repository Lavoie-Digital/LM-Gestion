import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";

// Founder photo, placed in /public. Rendered in black & white via `img-grayscale`.
const OWNER_PHOTO = "/proprio.avif";

export function Firme() {
  return (
    <section id="maison-de-gestion" className="section-y bg-paper">
      <div className="shell grid items-start gap-12 lg:grid-cols-[0.82fr_1fr] lg:gap-20">
        {/* Founder photo */}
        <Reveal className="lg:sticky lg:top-28">
          <figure className="group relative aspect-[4/5] overflow-hidden rounded-[2px] border border-line bg-paper-2">
            <Image
              src={OWNER_PHOTO}
              alt="La fondatrice de LM Gestion Immobilière"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="img-grayscale object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 text-paper">
              <span className="block font-display text-xl leading-none tracking-tight">
                Fondatrice et PDG
              </span>
              <span className="mono mt-2 block text-[0.6rem] uppercase tracking-[0.2em] text-paper/70">
                LM Gestion Immobilière
              </span>
            </figcaption>
          </figure>
        </Reveal>

        {/* Text */}
        <div>
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="kicker text-smoke">01</span>
              <span className="h-px w-10 bg-line-strong" />
              <span className="kicker text-ink/70">Maison de gestion</span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="mt-7 text-balance font-display text-[clamp(1.85rem,3.4vw,2.9rem)] font-light leading-[1.1] tracking-tight">
              Nous gérons chaque immeuble comme s'il était{" "}
              <span className="italic">le nôtre</span>.
            </h2>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-6 text-pretty text-[1.0625rem] leading-relaxed text-smoke">
              LM Gestion est une entreprise créée avec la conviction qu'une gestion immobilière
              efficace repose sur la rigueur, la communication et un service de proximité.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <h3 className="mt-12 font-display text-xl tracking-tight sm:text-2xl">
              Notre engagement
            </h3>
          </Reveal>

          <div className="mt-5 flex flex-col gap-4 text-pretty leading-relaxed text-smoke">
            <Reveal delay={0.24}>
              <p>
                Ma mission est d'offrir aux propriétaires un service clé en main qui leur
                permet de maximiser la valeur de leurs investissements tout en leur procurant
                une réelle tranquillité d'esprit.
              </p>
            </Reveal>
            <Reveal delay={0.28}>
              <p>
                Chez LM Gestion, nous gérons chaque immeuble comme s'il était le nôtre. Nous
                assurons la coordination de tous les intervenants, le suivi des opérations
                quotidiennes et l'entretien des bâtiments afin d'offrir un environnement de
                qualité aux locataires et une gestion sans souci aux propriétaires.
              </p>
            </Reveal>
            <Reveal delay={0.32}>
              <p>
                Une gestion professionnelle, proactive et humaine, adaptée aux besoins de
                chaque client.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
