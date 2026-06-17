import { TRUST_MARQUEE } from "@/lib/data";
import { Marquee } from "@/components/ui/marquee";

export function TrustStrip() {
  const items = TRUST_MARQUEE.map((label, i) => (
    <span
      key={i}
      className="font-display text-xl tracking-tight text-ink/70 md:text-2xl"
    >
      {label}
    </span>
  ));

  return (
    <section className="border-y border-line bg-paper py-7" aria-label="Notre expertise">
      <Marquee
        items={items}
        duration={42}
        separator={
          <span
            aria-hidden
            className="mx-9 inline-block size-1.5 rotate-45 bg-ink/30"
          />
        }
      />
    </section>
  );
}
