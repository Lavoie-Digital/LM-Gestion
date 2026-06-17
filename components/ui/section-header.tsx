import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function SectionHeader({
  index,
  label,
  title,
  lede,
  align = "left",
  dark = false,
  className,
  titleClassName,
}: {
  index?: string;
  label: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <Reveal>
        <div
          className={cn(
            "flex items-center gap-4",
            align === "center" && "justify-center"
          )}
        >
          {index && (
            <span className={cn("kicker", dark ? "text-ash" : "text-smoke")}>{index}</span>
          )}
          <span className={cn("h-px w-10", dark ? "bg-line-dark" : "bg-line-strong")} />
          <span className={cn("kicker", dark ? "text-paper/80" : "text-ink/70")}>{label}</span>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <h2
          className={cn(
            "mt-6 max-w-3xl text-balance font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.02]",
            dark ? "text-paper" : "text-ink",
            align === "center" && "mx-auto",
            titleClassName
          )}
        >
          {title}
        </h2>
      </Reveal>

      {lede && (
        <Reveal delay={0.16}>
          <p
            className={cn(
              "mt-6 max-w-xl text-pretty text-[1.0625rem] leading-relaxed",
              dark ? "text-ash" : "text-smoke",
              align === "center" && "mx-auto"
            )}
          >
            {lede}
          </p>
        </Reveal>
      )}
    </div>
  );
}
