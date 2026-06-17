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
                La fondatrice
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
              Nous sommes des passionnés de gestion immobilière{" "}
              <span className="italic">intégrée</span>.
            </h2>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-6 text-pretty text-[1.0625rem] leading-relaxed text-smoke">
              Nous offrons l'ensemble des services requis pour administrer tout parc
              immobilier résidentiel — d'un premier plex à un portefeuille d'immeubles de
              prestige, du plus simple au plus complexe.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <h3 className="mt-12 font-display text-xl tracking-tight sm:text-2xl">
              Notre vision de la gestion
            </h3>
          </Reveal>

          <div className="mt-5 flex flex-col gap-4 text-pretty leading-relaxed text-smoke">
            <Reveal delay={0.24}>
              <p>
                La maison a été fondée avec l'idée que bien gérer un immeuble exige de réunir
                tous les intervenants autour d'une même table ; le travail en silo mène
                inévitablement à des coûts d'exploitation élevés, à des décisions mal
                coordonnées et à un actif qui rend en deçà de son plein potentiel.
              </p>
            </Reveal>
            <Reveal delay={0.28}>
              <p>
                LM s'implique dans chaque mandat comme un véritable vecteur de coordination.
                Nos gestionnaires conjuguent la maîtrise technique de l'entretien et des baux
                à une vision d'ensemble de la rentabilité de votre parc.
              </p>
            </Reveal>
            <Reveal delay={0.32}>
              <p>
                Nous croyons que traiter chaque propriétaire, chaque locataire et chaque
                partenaire sur un pied d'égalité optimise le flot des idées — et la valeur de
                votre patrimoine.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
