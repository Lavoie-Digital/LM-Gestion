"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { easeLux, viewportOnce } from "@/lib/motion";

type Point = { month: string; value: number };

/** Courbe d'aire monochrome, lissée. Hérite de currentColor. */
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
  const W = 720;
  const H = height;
  const padY = 28;
  const padX = 6;

  // Robustesse : on ignore les valeurs non finies (un seul NaN casserait le tracé).
  const clean = data.filter((d) => Number.isFinite(d.value));
  const values = clean.map((d) => d.value);
  const n = clean.length;
  const min = n ? Math.min(...values) : 0;
  const max = n ? Math.max(...values) : 1;
  const span = max - min || 1;

  const x = (i: number) => (n > 1 ? padX + (i / (n - 1)) * (W - 2 * padX) : W / 2);
  const y = (v: number) => padY + (1 - (v - min) / span) * (H - 2 * padY);
  const pts = clean.map((d, i) => ({ x: x(i), y: y(d.value) }));

  // Tracé lissé (Catmull-Rom → Bézier cubique) — courbe douce sans cassure.
  function smooth(points: { x: number; y: number }[]): string {
    if (points.length === 0) return "";
    if (points.length === 1) return `M${points[0].x},${points[0].y}`;
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  const line = smooth(pts);
  const area = n > 0 ? `${line} L${pts[n - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z` : "";
  const grid = [0.0, 0.5, 1.0];
  const showDots = n > 1 && n <= 14;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Évolution des revenus locatifs"
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.06" />
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
            strokeOpacity="0.08"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {n === 0 ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" fill="currentColor" fillOpacity="0.4" fontSize="14">
            Aucune donnée
          </text>
        ) : (
          <>
            {/* aire (fondu doux) */}
            <motion.path
              d={area}
              fill={`url(#area-${id})`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.9, ease: easeLux }}
            />

            {/* ligne — toujours entièrement tracée (fondu d'opacité, jamais coupée) */}
            <motion.path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, ease: easeLux }}
            />

            {/* points */}
            {showDots &&
              pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="currentColor" fillOpacity="0.55" vectorEffect="non-scaling-stroke" />
              ))}

            {/* marqueur de fin */}
            <circle cx={pts[n - 1].x} cy={pts[n - 1].y} r="4.5" fill="currentColor" vectorEffect="non-scaling-stroke" />
            <circle cx={pts[n - 1].x} cy={pts[n - 1].y} r="8" fill="currentColor" fillOpacity="0.14" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      {showLabels && n > 0 && (
        <div className="mt-3 flex justify-between font-[family-name:var(--font-jetbrains)] text-[0.6rem] uppercase tracking-wider text-current opacity-45">
          {clean.map((d, i) => {
            // Sur beaucoup de points, on n'affiche qu'un libellé sur k pour éviter l'encombrement.
            const step = Math.ceil(n / 8);
            const show = i % step === 0 || i === n - 1;
            return (
              <span key={i} className={show ? "" : "hidden"}>
                {show ? d.month : ""}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
