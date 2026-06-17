"use client";

import { motion, useReducedMotion } from "motion/react";
import { easeLux, viewportOnce } from "@/lib/motion";

type Bar = { label: string; value: number };

/** Vertical bars that grow from the baseline on scroll. Inherits currentColor. */
export function BarChart({
  data,
  height = 240,
  valueFormat,
  className,
}: {
  data: Bar[];
  height?: number;
  valueFormat?: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const W = 720;
  const H = height;
  const padTop = 30;
  const padBottom = 4;
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const n = data.length;
  const col = W / n;
  const barW = col * 0.5;
  const maxIndex = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Comparaison par immeuble"
      >
        <line
          x1="0"
          x2={W}
          y1={H - padBottom}
          y2={H - padBottom}
          stroke="currentColor"
          strokeOpacity="0.12"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const h = ((d.value / max) * (H - padTop - padBottom));
          const cx = (i + 0.5) * col;
          const xLeft = cx - barW / 2;
          const yTop = H - padBottom - h;
          const isMax = i === maxIndex;
          return (
            <g key={d.label}>
              {valueFormat && (
                <motion.text
                  x={cx}
                  y={yTop - 10}
                  textAnchor="middle"
                  className="mono"
                  fontSize="15"
                  fill="currentColor"
                  fillOpacity={isMax ? 0.95 : 0.55}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                >
                  {valueFormat(d.value)}
                </motion.text>
              )}
              <motion.rect
                x={xLeft}
                y={yTop}
                width={barW}
                height={Math.max(h, 0.1)}
                rx="1.5"
                fill="currentColor"
                fillOpacity={isMax ? 0.92 : 0.34}
                style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 0.9, ease: easeLux, delay: i * 0.07 }}
              />
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex">
        {data.map((d) => (
          <span
            key={d.label}
            className="flex-1 truncate px-1 text-center text-[0.68rem] leading-tight text-current opacity-55"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
