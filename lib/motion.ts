import type { Variants, Transition } from "motion/react";

/** Signature luxury easing — a slow, confident settle (ease-out-expo flavour). */
export const easeLux = [0.16, 1, 0.3, 1] as const;
export const easeOutQuint = [0.22, 1, 0.36, 1] as const;
export const easeInOutSoft = [0.65, 0, 0.35, 1] as const;

export const springSoft: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.6,
};

/**
 * Default scroll-reveal trigger — fires once, a touch before fully in view.
 * `amount` is kept low so containers taller than the viewport (e.g. the
 * single-column portfolio grid on mobile) can still reach the threshold and
 * reveal; a higher value leaves tall sections stuck invisible on phones.
 */
export const viewportOnce = { once: true, amount: 0.1, margin: "0px 0px -8% 0px" };

/** Fade + rise. Accepts an index via custom for stagger delays. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easeLux, delay: i * 0.08 },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 1.1, ease: easeLux, delay: i * 0.08 },
  }),
};

/** Container that staggers its children's `show` state. */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

/** Editorial line that clips up from a mask. Pair with an overflow-hidden parent. */
export const lineReveal: Variants = {
  hidden: { y: "110%" },
  show: (i: number = 0) => ({
    y: "0%",
    transition: { duration: 1, ease: easeLux, delay: i * 0.07 },
  }),
};

/** A subtle scale/blur settle for hero imagery. */
export const imageSettle: Variants = {
  hidden: { opacity: 0, scale: 1.08 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.4, ease: easeLux },
  },
};
