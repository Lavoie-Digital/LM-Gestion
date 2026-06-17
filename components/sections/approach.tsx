import Image from "next/image";
import { APPROACH_IMAGE, PROCESS } from "@/lib/data";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";

/** Content-only approach block (light). Page supplies header + section wrapper. */
export function Approach() {
  return (
    <div className="grid items-start gap-14 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
      {/* Image */}
      <Reveal className="lg:sticky lg:top-28">
        <figure className="relative aspect-[4/5] overflow-hidden rounded-[2px] border border-line">
          <Image
            src={APPROACH_IMAGE}
            alt="Intérieur architectural d'un immeuble géré par LM"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="img-grayscale object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6">
            <span className="kicker text-paper/80">La méthode LM</span>
            <span className="mono text-[0.6rem] uppercase tracking-[0.2em] text-paper/60">
              Audit · Marché · Gestion · IA
            </span>
          </figcaption>
        </figure>
      </Reveal>

      {/* Steps */}
      <Stagger className="flex flex-col">
        {PROCESS.map((step) => (
          <StaggerItem
            key={step.index}
            className="grid grid-cols-[auto_1fr] gap-6 border-t border-line py-9 first:border-t-0 first:pt-0 sm:gap-10"
          >
            <span className="font-display text-5xl font-light leading-none text-ink/20 sm:text-6xl">
              {step.index}
            </span>
            <div>
              <h3 className="font-display text-2xl tracking-tight sm:text-3xl">{step.title}</h3>
              <p className="mt-3 max-w-md text-pretty leading-relaxed text-smoke">
                {step.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
