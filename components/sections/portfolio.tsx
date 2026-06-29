import Image from "next/image";
import { PORTFOLIO, type Property } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

function PropertyCard({ property }: { property: Property }) {
  return (
    <StaggerItem
      as="figure"
      className={cn(
        "group relative mb-5 block break-inside-avoid overflow-hidden rounded-[2px] border border-line bg-paper-2"
      )}
    >
      {/* width/height natifs + w-full h-auto → format respecté, aucun recadrage. */}
      <Image
        src={property.image}
        alt={`Immeuble sous gestion — ${property.neighborhood}`}
        width={property.width}
        height={property.height}
        quality={90}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="img-grayscale block h-auto w-full transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
      />

      {/* Voile sombre — révélé au survol (toujours visible sous lg, faute de survol). */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noir/85 via-noir/25 to-transparent opacity-100 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100" />

      {/* Localisation — apparaît en fondu + glissé au survol. */}
      <figcaption className="absolute inset-x-0 bottom-0 p-6 text-paper transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
        <span className="kicker text-paper/70">Immeuble sous gestion</span>
        <h3 className="mt-2 font-display text-[1.7rem] leading-none tracking-tight">
          {property.neighborhood}
        </h3>
      </figcaption>
    </StaggerItem>
  );
}

/**
 * Mosaïque verticale (2 colonnes) : grandes photos qui gardent leur format natif
 * et s'imbriquent ; la localisation se révèle au survol.
 */
export function Portfolio() {
  return (
    <Stagger className="columns-1 gap-5 md:columns-2">
      {PORTFOLIO.map((property) => (
        <PropertyCard key={property.name} property={property} />
      ))}
    </Stagger>
  );
}
