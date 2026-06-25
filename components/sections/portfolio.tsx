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
          alt={`Immeuble sous gestion — ${property.neighborhood}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="img-grayscale object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-noir/15 to-transparent" />
      </div>

      {/* Anonyme : on n'affiche que la ville (décision cliente). */}
      <figcaption className="absolute inset-x-0 bottom-0 p-6 text-paper">
        <h3 className="font-display text-[1.7rem] leading-none tracking-tight">
          {property.neighborhood}
        </h3>
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
