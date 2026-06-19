import Image from "next/image";
import { PORTFOLIO, type Property } from "@/lib/data";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

function PropertyCard({ property }: { property: Property }) {
  return (
    <StaggerItem
      as="figure"
      className="group relative self-start overflow-hidden rounded-[2px] border border-line bg-paper-2"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={property.image}
          alt={`${property.name} — ${property.neighborhood}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="img-grayscale object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-noir/15 to-transparent" />
        <span className="absolute right-4 top-4 border border-paper/30 px-2.5 py-1 font-[family-name:var(--font-jetbrains)] text-[0.6rem] uppercase tracking-[0.18em] text-paper/90 backdrop-blur-sm">
          {property.units} logements
        </span>
      </div>

      <figcaption className="absolute inset-x-0 bottom-0 p-6 text-paper">
        <span className="kicker text-paper/70">{property.neighborhood}</span>
        <h3 className="mt-2.5 font-display text-[1.7rem] leading-none tracking-tight">
          {property.name}
        </h3>
        <span className="mt-2 block text-sm text-paper/70">{property.category}</span>
      </figcaption>
    </StaggerItem>
  );
}

export function Portfolio() {
  return (
    <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:[&>*:nth-child(3n+2)]:mt-20">
      {PORTFOLIO.map((property) => (
        <PropertyCard key={property.name} property={property} />
      ))}
    </Stagger>
  );
}
