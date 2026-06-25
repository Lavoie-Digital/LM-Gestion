import {
  Building2,
  Compass,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { SERVICES, type Service } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

const ICONS: Record<Service["icon"], LucideIcon> = {
  building: Building2,
  sparkles: Sparkles,
  wrench: Wrench,
  shield: ShieldCheck,
  ledger: ScrollText,
  compass: Compass,
};

function ServiceCell({ service, className }: { service: Service; className?: string }) {
  const Icon = ICONS[service.icon];
  return (
    <StaggerItem
      className={cn(
        "group relative flex flex-col border-b border-r border-line p-8 transition-colors duration-500 hover:bg-paper-2 md:p-10",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <Icon className="size-7 text-ink/80" strokeWidth={1.4} />
        <span className="kicker text-smoke">{service.index}</span>
      </div>

      <h3 className="mt-10 font-display text-[1.6rem] leading-tight tracking-tight">
        {service.title}
      </h3>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-smoke">{service.description}</p>

      <ul className="mt-7 flex flex-col gap-2.5 border-t border-line-soft pt-6">
        {service.points.map((point) => (
          <li key={point} className="flex items-center gap-3 text-sm text-ink/75">
            <span aria-hidden className="size-1 rotate-45 bg-ink/40" />
            {point}
          </li>
        ))}
      </ul>
    </StaggerItem>
  );
}

/** Content-only services grid (page supplies the header + section wrapper). */
export function Services() {
  const total = SERVICES.length;
  const remainder = total % 3; // nombre de cartes sur la dernière rangée incomplète
  const lastRowStart = total - remainder;

  // En grille 6 colonnes (chaque carte = 2 colonnes), on décale la 1re carte
  // de la dernière rangée pour la centrer : 2 cartes → départ col. 2 ; 1 carte → col. 3.
  const offsetFor = (i: number) => {
    if (i !== lastRowStart) return undefined;
    if (remainder === 2) return "lg:col-start-2";
    if (remainder === 1) return "lg:col-start-3";
    return undefined;
  };

  // La bordure gauche n'est pas portée par le conteneur (sinon elle reste à
  // l'extrémité, détachée des cartes centrées de la dernière rangée) : chaque
  // carte la plus à gauche de SA rangée porte sa propre bordure gauche.
  //  · base (1 col) : toutes les cartes sont à gauche
  //  · sm  (2 col)  : les cartes d'index pair
  //  · lg  (6 col)  : la 1re carte (i=0) et la 1re de la dernière rangée
  const leftBorder = (i: number) =>
    cn(
      "border-l",
      i % 2 === 0 ? "sm:border-l" : "sm:border-l-0",
      i === 0 || i === lastRowStart ? "lg:border-l" : "lg:border-l-0"
    );

  return (
    <Stagger className="grid grid-cols-1 border-t border-line sm:grid-cols-2 lg:grid-cols-6">
      {SERVICES.map((service, i) => (
        <ServiceCell
          key={service.index}
          service={service}
          className={cn("lg:col-span-2", leftBorder(i), offsetFor(i))}
        />
      ))}
    </Stagger>
  );
}
