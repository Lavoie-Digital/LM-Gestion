import { cn } from "@/lib/utils";

/** The roofline mark, redrawn from the brand logo. Inherits `currentColor`. */
export function RoofMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 38"
      fill="none"
      aria-hidden
      className={className}
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* left gable */}
      <path d="M4 31 L26 12 L41 25" />
      {/* right gable, overlapping and higher */}
      <path d="M31 19 L45 9 L60 27" />
      {/* chimney on the left slope */}
      <path d="M13 23.5 L13 16 L17 16 L17 19.5" />
    </svg>
  );
}

/**
 * Brand lockup. `mark` = roof only; `compact` = roof + LM + subtitle;
 * `stacked` = centered roof over the LM monogram and wordmark.
 */
export function Logo({
  variant = "compact",
  className,
  subtitle = true,
}: {
  variant?: "mark" | "compact" | "stacked";
  className?: string;
  subtitle?: boolean;
}) {
  if (variant === "mark") {
    return <RoofMark className={cn("h-7 w-auto", className)} />;
  }

  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center text-current", className)}>
        <RoofMark className="h-10 w-auto" />
        <span className="mt-1 font-display text-3xl leading-none tracking-tight">
          L<span className="mx-[0.06em] font-light italic opacity-70">/</span>M
        </span>
        {subtitle && (
          <span className="kicker mt-2 opacity-70">Gestion Immobilière</span>
        )}
      </span>
    );
  }

  // compact (default) — for the navbar / footer
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-current", className)}>
      <RoofMark className="h-8 w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] leading-none tracking-tight">
          L<span className="mx-[0.04em] font-light italic opacity-70">/</span>M
          <span className="ml-1.5 align-middle text-[0.78rem] font-normal not-italic tracking-[0.02em] opacity-90">
            Gestion
          </span>
        </span>
        {subtitle && (
          <span className="mono mt-1 text-[0.5rem] uppercase tracking-[0.34em] opacity-55">
            Immobilière · Saguenay
          </span>
        )}
      </span>
    </span>
  );
}
