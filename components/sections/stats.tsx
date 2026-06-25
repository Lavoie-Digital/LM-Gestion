"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

type Figure = {
  to: number;
  decimals: number;
  suffix?: string;
  label: string;
};

const FIGURES: Figure[] = [
  { to: 511, decimals: 0, suffix: "", label: "Logements sous gestion" },
  { to: 98, decimals: 0, suffix: " %", label: "Occupation moyenne" },
  { to: 5.77, decimals: 2, suffix: " M$", label: "Loyers administrés / an" },
  { to: 4.9, decimals: 1, suffix: "/5", label: "Satisfaction propriétaires" },
];

const fmt = (decimals: number, suffix?: string) => (n: number) =>
  `${n.toLocaleString("fr-CA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix ?? ""}`;

export function Stats() {
  return (
    <section className="relative overflow-hidden border-y border-line-dark bg-ink text-paper">
      <div className="grid-faint absolute inset-0 opacity-30" aria-hidden />
      <Stagger className="shell relative grid grid-cols-2 gap-y-12 py-16 sm:grid-cols-2 md:py-20 lg:grid-cols-4 lg:gap-0">
        {FIGURES.map((f, i) => (
          <StaggerItem
            key={f.label}
            className={`flex flex-col px-2 lg:px-5 ${i !== 0 ? "lg:border-l lg:border-line-dark" : ""}`}
          >
            <AnimatedNumber
              value={f.to}
              format={fmt(f.decimals, f.suffix)}
              className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-light leading-none tracking-tight"
            />
            <span className="mt-4 text-[0.8rem] leading-snug text-ash">{f.label}</span>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
