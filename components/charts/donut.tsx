"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { easeLux, viewportOnce } from "@/lib/motion";

type Segment = { label: string; value: number };

export const DONUT_SHADES = [0.92, 0.6, 0.38, 0.22, 0.14];

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

/** Monochrome donut. Segments draw on scroll; shades distinguish them. */
export function Donut({
  data,
  size = 220,
  thickness = 22,
  gap = 3,
  center,
  className,
}: {
  data: Segment[];
  size?: number;
  thickness?: number;
  gap?: number;
  center?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let acc = 0;
  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const start = acc * 360;
    const end = (acc + frac) * 360;
    acc += frac;
    const g = frac > 0.04 ? gap : 0;
    return {
      ...d,
      i,
      d: arcPath(cx, cy, r, start + g / 2, end - g / 2),
      opacity: DONUT_SHADES[i] ?? 0.12,
    };
  });

  return (
    <div className={className} style={{ position: "relative", width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Répartition des revenus par catégorie d'actif">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth={thickness} />
        {segments.map((s) => (
          <motion.path
            key={s.i}
            d={s.d}
            fill="none"
            stroke="currentColor"
            strokeOpacity={s.opacity}
            strokeWidth={thickness}
            strokeLinecap="butt"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 1.1, ease: easeLux, delay: 0.15 + s.i * 0.14 }}
          />
        ))}
      </svg>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      )}
    </div>
  );
}
