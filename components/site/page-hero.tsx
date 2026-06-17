import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";

/** Dark opening band for inner pages — also gives the fixed Navbar a dark
 *  surface so its (paper) text stays legible at the top of every route. */
export function PageHero({
  index,
  label,
  title,
  intro,
  image,
}: {
  index?: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  image?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-noir text-paper">
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="img-grayscale object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/80 to-noir/60" />
        </>
      )}
      <div className="grid-faint absolute inset-0 opacity-30" aria-hidden />

      <div className="shell relative pb-16 pt-36 md:pb-24 md:pt-44">
        <Reveal>
          <div className="flex items-center gap-4">
            {index && <span className="kicker text-ash">{index}</span>}
            <span className="h-px w-10 bg-line-dark" />
            <span className="kicker text-paper/80">{label}</span>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-7 max-w-4xl text-balance font-display text-[clamp(2.5rem,6vw,5rem)] font-light leading-[1.02] tracking-[-0.02em]">
            {title}
          </h1>
        </Reveal>

        {intro && (
          <Reveal delay={0.16}>
            <p className="mt-7 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-ash md:text-lg">
              {intro}
            </p>
          </Reveal>
        )}
      </div>

      <div className="hr-line-dark" />
    </section>
  );
}
