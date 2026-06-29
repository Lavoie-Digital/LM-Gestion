import Image from "next/image";
import { PORTFOLIO, type Property } from "@/lib/data";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

function PropertyCard({ property }: { property: Property }) {
  return (
    <StaggerItem
      as="figure"
      className="group relative block overflow-hidden rounded-[2px] border border-line bg-paper-2"
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
 * Répartit les photos en 2 colonnes équilibrées par hauteur (algorithme LPT :
 * on assigne chaque photo, de la plus haute à la plus basse, à la colonne la
 * moins remplie). Les deux colonnes se terminent ainsi quasi à la même hauteur.
 * La hauteur relative d'une photo = height / width (largeur de colonne égale).
 */
function balanceColumns(items: Property[]): [Property[], Property[]] {
  const sorted = [...items].sort((a, b) => b.height / b.width - a.height / a.width);
  const cols: [Property[], Property[]] = [[], []];
  const sums = [0, 0];
  for (const it of sorted) {
    const target = sums[0] <= sums[1] ? 0 : 1;
    cols[target].push(it);
    sums[target] += it.height / it.width;
  }
  return cols;
}

function Column({ items }: { items: Property[] }) {
  return (
    <Stagger className="flex flex-col gap-5">
      {items.map((property) => (
        <PropertyCard key={property.name} property={property} />
      ))}
    </Stagger>
  );
}

/**
 * Mosaïque verticale, 2 colonnes équilibrées (mêmes fins de colonne) ; chaque
 * photo garde son format natif ; la localisation se révèle au survol.
 */
export function Portfolio() {
  const [left, right] = balanceColumns(PORTFOLIO);
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-start">
      <Column items={left} />
      <Column items={right} />
    </div>
  );
}
