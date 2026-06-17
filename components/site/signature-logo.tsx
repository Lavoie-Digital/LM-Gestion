"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { easeLux } from "@/lib/motion";

/**
 * Brand mark revealed like a signature. The roofline and the flourish are
 * drawn with a left-to-right CLIP wipe over solid strokes (not pathLength),
 * which guarantees the final state shows every line fully — no dash gaps or
 * holes. The L/M monogram wipes in the same way. Uses `currentColor`.
 */
export function SignatureLogo({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  const wipe = (delay: number, duration = 1) => ({
    initial: reduce ? false : { clipPath: "inset(0 100% 0 0)" },
    animate: { clipPath: "inset(0 0% 0 0)" },
    transition: { duration, ease: easeLux, delay },
  });

  return (
    <div className={cn("inline-flex flex-col items-start text-current", className)}>
      {/* Roofline — the navbar's double gable, revealed by a clip wipe */}
      <motion.div {...wipe(0.2, 1.1)}>
        <svg
          viewBox="0 7 64 25"
          fill="none"
          aria-hidden
          className="h-20 w-auto md:h-28"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 31 L26 12 L41 25" />
          <path d="M31 19 L45 9 L60 27" />
          <path d="M13 23.5 L13 16 L17 16 L17 19.5" />
        </svg>
      </motion.div>

      {/* L/M monogram */}
      <motion.span
        className="mt-1 block pb-1 font-display text-[3.5rem] leading-[1.05] tracking-tight md:text-[6.25rem]"
        {...wipe(1.05, 0.9)}
      >
        L<span className="mx-[0.02em] font-light italic opacity-70">/</span>M
      </motion.span>

      {/* flourish underline */}
      <motion.div {...wipe(1.75, 0.7)}>
        <svg
          viewBox="0 0 120 6"
          fill="none"
          aria-hidden
          className="mt-1 h-[6px] w-44 md:w-64"
          preserveAspectRatio="none"
        >
          <path
            d="M1 3 C 30 1, 90 5, 119 2"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* wordmark */}
      <motion.span
        className="mono mt-4 text-[0.62rem] uppercase tracking-[0.32em] opacity-70 md:text-[0.78rem]"
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeLux, delay: 2 }}
      >
        Gestion Immobilière
      </motion.span>
    </div>
  );
}
