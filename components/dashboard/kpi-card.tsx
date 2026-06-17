"use client";

import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/charts/sparkline";

export function KpiCard({
  label,
  value,
  format,
  deltaLabel,
  trend,
  spark,
  icon: Icon,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  deltaLabel: string;
  trend: "up" | "down" | "flat";
  spark: number[];
  icon: LucideIcon;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="relative flex flex-col justify-between rounded-[4px] border border-line bg-white p-5 transition-shadow duration-500 hover:shadow-[var(--shadow-lift)] md:p-6">
      <div className="flex items-center justify-between">
        <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">
          {label}
        </span>
        <Icon className="size-4 text-ink/35" strokeWidth={1.6} />
      </div>

      <AnimatedNumber
        value={value}
        format={format}
        className="mt-5 font-display text-[clamp(1.9rem,3.4vw,2.4rem)] font-light leading-none tracking-tight tabular"
      />

      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[0.72rem] leading-tight text-smoke">
          <TrendIcon className="size-3.5 shrink-0 text-ink/55" strokeWidth={2} />
          {deltaLabel}
        </span>
        <Sparkline data={spark} width={92} height={30} className="shrink-0 text-ink/30" />
      </div>
    </div>
  );
}
