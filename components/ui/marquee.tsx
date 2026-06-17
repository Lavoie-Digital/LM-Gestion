"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Seamless horizontal marquee. Pauses on hover; respects reduced motion via CSS. */
export function Marquee({
  items,
  duration = 38,
  className,
  itemClassName,
  separator,
}: {
  items: ReactNode[];
  duration?: number;
  className?: string;
  itemClassName?: string;
  separator?: ReactNode;
}) {
  const Row = (rowKey: string, hidden: boolean) => (
    <div
      key={rowKey}
      className="animate-marquee flex shrink-0 items-center"
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
      aria-hidden={hidden}
    >
      {items.map((item, i) => (
        <span key={`${rowKey}-${i}`} className={cn("flex items-center", itemClassName)}>
          {item}
          {separator ?? <span className="mx-8 select-none opacity-30">—</span>}
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("group flex w-full overflow-hidden", className)}>
      {Row("a", false)}
      {Row("b", true)}
    </div>
  );
}
