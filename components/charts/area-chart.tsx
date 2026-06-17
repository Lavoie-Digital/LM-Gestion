"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { easeLux, viewportOnce } from "@/lib/motion";

type Point = { month: string; value: number };

/** Monochrome area chart that draws its line on scroll. Inherits currentColor. */
export function AreaChart({
  data,
  height = 260,
  showLabels = true,
  className,
}: {
  data: Point[];
  height?: number;
  showLabels?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const W = 720;
  const H = height;
  const padY = 26;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const n = data.length;

  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => padY + (1 - (v - min) / span) * (H - 2 * padY);

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const grid = [0.0, 0.33, 0.66, 1.0];

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Évolution des revenus locatifs sur douze mois"
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {grid.map((g) => (
          <line
            key={g}
            x1="0"
            x2={W}
            y1={padY + g * (H - 2 * padY)}
            y2={padY + g * (H - 2 * padY)}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* area fill */}
        <motion.path
          d={area}
          fill={`url(#area-${id})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1, ease: easeLux, delay: 0.5 }}
        />

        {/* line */}
        <motion.path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.6, ease: easeLux }}
        />

        {/* end marker */}
        <motion.circle
          cx={x(n - 1)}
          cy={y(values[n - 1])}
          r="4"
          fill="currentColor"
          vectorEffect="non-scaling-stroke"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: easeLux, delay: 1.5 }}
        />
      </svg>

      {showLabels && (
        <div className="mt-3 flex justify-between font-[family-name:var(--font-jetbrains)] text-[0.6rem] uppercase tracking-wider text-current opacity-45">
          {data.map((d, i) => (
            <span key={i} className={i % 2 === 1 ? "hidden sm:inline" : ""}>
              {d.month}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
