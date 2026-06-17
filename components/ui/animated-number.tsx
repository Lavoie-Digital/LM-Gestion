"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * "Computing" number: digits scramble randomly, then lock in from left to
 * right until the value settles — a glitch-then-fix effect that reads as a
 * live calculation. Non-digit characters (spaces, $, %, /, ,) stay fixed.
 *
 * The final value is rendered invisibly to reserve its exact width, and the
 * animating value is overlaid on top — so the scramble never reflows or wraps
 * to a second line, even with proportional (non-tabular) display fonts.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 1100,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();

  const target = format ? format(value) : Math.round(value).toLocaleString("fr-CA");
  const placeholder = target.replace(/\d/g, "0");
  const [display, setDisplay] = useState(reduce ? target : placeholder);

  useEffect(() => {
    if (reduce) {
      setDisplay(target);
      return;
    }
    if (!inView) return;

    const digitPositions: number[] = [];
    for (let i = 0; i < target.length; i++) {
      if (/\d/.test(target[i])) digitPositions.push(i);
    }
    const total = digitPositions.length;
    if (total === 0) {
      setDisplay(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const locked = Math.floor(eased * total);
      const chars = target.split("");
      for (let k = locked; k < total; k++) {
        chars[digitPositions[k]] = String(Math.floor(Math.random() * 10));
      }
      setDisplay(chars.join(""));
      if (p < 1) raf = requestAnimationFrame(loop);
      else setDisplay(target);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce, target, duration]);

  return (
    <span
      ref={ref}
      className={cn("relative inline-block whitespace-nowrap tabular-nums", className)}
    >
      {/* reserves the final width/height so the scramble never reflows */}
      <span className="invisible">{target}</span>
      <span aria-hidden className="absolute inset-0">
        {display}
      </span>
    </span>
  );
}
