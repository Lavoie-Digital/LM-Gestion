"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { HERO_IMAGE } from "@/lib/data";
import { easeLux } from "@/lib/motion";
import { ButtonLink } from "@/components/ui/button";
import { SignatureLogo } from "@/components/site/signature-logo";

const HEADLINE = ["Votre patrimoine", "mérite une gestion", "d'exception."];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // On phones the scroll-linked parallax that fades/lifts the hero away feels
  // janky and "hides" the content too early, so we disable it below ~768px and
  // only keep the entrance animations.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const noParallax = reduce || isMobile;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-noir text-paper"
    >
      {/* Full-bleed architecture */}
      <motion.div
        className="absolute inset-0"
        style={noParallax ? undefined : { y: imgY, scale: imgScale }}
      >
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { clipPath: "inset(0% 0% 18% 0%)", opacity: 0 }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
          transition={{ duration: 1.5, ease: easeLux, delay: 0.1 }}
        >
          <Image
            src={HERO_IMAGE}
            alt="Architecture résidentielle haut de gamme au Saguenay"
            fill
            priority
            sizes="100vw"
            className="img-grayscale object-cover opacity-[0.68]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/55 to-noir/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir/85 via-noir/30 to-transparent" />
      </motion.div>

      <div className="grid-faint absolute inset-0 opacity-40" aria-hidden />

      {/* Top rail */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: easeLux, delay: 0.15 }}
        className="shell relative z-10 flex items-center justify-between gap-4 pt-28 md:pt-32"
      >
        <span className="flex items-center gap-3">
          <span className="h-px w-8 bg-paper/40" />
          <span className="kicker text-paper/70">Saguenay · Québec</span>
        </span>
        <span className="mono text-[0.6rem] uppercase tracking-[0.22em] text-paper/45">
          Maison de gestion privée · Est. 2023
        </span>
      </motion.div>

      {/* Headline + CTA */}
      <motion.div
        className="shell relative z-10 flex flex-1 flex-col items-center justify-center pb-20 pt-12 text-center"
        style={noParallax ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <SignatureLogo className="mb-8 text-paper" />

        <h1 className="max-w-4xl font-display text-[clamp(2.5rem,7vw,6rem)] font-light leading-[0.98] tracking-[-0.03em]">
          {HEADLINE.map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "115%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, ease: easeLux, delay: 0.3 + i * 0.12 }}
              >
                {i === 2 ? <span className="italic text-paper/80">{line}</span> : line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: easeLux, delay: 0.7 }}
          className="mt-8 max-w-xl text-pretty text-[1.0625rem] leading-relaxed text-paper/75 md:text-lg"
        >
          Chez LM Gestion, nous prenons en charge tous les aspects de la gestion de votre
          immeuble afin d'offrir un service clé en main et une tranquillité d'esprit à nos
          propriétaires comme à nos locataires.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: easeLux, delay: 0.85 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <ButtonLink href="/services" variant="light" size="lg">
            Découvrir nos services
          </ButtonLink>
          <ButtonLink href="/connexion" variant="outline-light" size="lg" arrow>
            Accéder à l'espace client
          </ButtonLink>
        </motion.div>
      </motion.div>
    </section>
  );
}
