"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { easeLux, fadeUp, stagger, staggerFast, viewportOnce } from "@/lib/motion";

const TAGS = {
  div: motion.div,
  li: motion.li,
  span: motion.span,
  section: motion.section,
  article: motion.article,
  figure: motion.figure,
} as const;

type Tag = keyof typeof TAGS;

/** Single element that fades + rises into view, once. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: Tag;
}) {
  const reduce = useReducedMotion();
  const Comp = TAGS[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.9, ease: easeLux, delay }}
    >
      {children}
    </Comp>
  );
}

/** Container that staggers its <StaggerItem> children when scrolled into view. */
export function Stagger({
  children,
  className,
  as = "div",
  fast = false,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  fast?: boolean;
}) {
  const reduce = useReducedMotion();
  const Comp = TAGS[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Comp
      className={className}
      variants={fast ? staggerFast : stagger}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
}) {
  const reduce = useReducedMotion();
  const Comp = TAGS[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Comp className={className} variants={fadeUp}>
      {children}
    </Comp>
  );
}
