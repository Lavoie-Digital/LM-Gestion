import { Quote } from "lucide-react";
import { TESTIMONIALS, type Testimonial } from "@/lib/data";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

function initialsOf(name: string) {
  return name
    .replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Card({ t }: { t: Testimonial }) {
  return (
    <StaggerItem className="flex flex-col justify-between rounded-[2px] border border-line bg-paper-2/50 p-8 transition-colors duration-500 hover:bg-paper-2 md:p-10">
      <div>
        <Quote className="size-8 text-ink/15" fill="currentColor" />
        <p className="mt-6 text-pretty font-display text-[1.4rem] leading-snug tracking-tight text-ink/90">
          {t.quote}
        </p>
      </div>
      <div className="mt-10 flex items-center gap-4 border-t border-line pt-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink font-[family-name:var(--font-jetbrains)] text-xs text-paper">
          {initialsOf(t.author)}
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{t.author}</p>
          <p className="mt-0.5 text-xs leading-snug text-smoke">{t.role}</p>
        </div>
      </div>
    </StaggerItem>
  );
}

/** Content-only testimonials grid. Page supplies the header + section wrapper. */
export function Testimonials() {
  return (
    <Stagger className="grid gap-4 md:grid-cols-3">
      {TESTIMONIALS.map((t) => (
        <Card key={t.author} t={t} />
      ))}
    </Stagger>
  );
}
