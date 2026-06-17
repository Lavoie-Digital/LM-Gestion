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
import { Stagger, StaggerItem } from "@/components/ui/reveal";

const ICONS: Record<Service["icon"], LucideIcon> = {
  building: Building2,
  sparkles: Sparkles,
  wrench: Wrench,
  shield: ShieldCheck,
  ledger: ScrollText,
  compass: Compass,
};

function ServiceCell({ service }: { service: Service }) {
  const Icon = ICONS[service.icon];
  return (
    <StaggerItem className="group relative flex flex-col border-b border-r border-line p-8 transition-colors duration-500 hover:bg-paper-2 md:p-10">
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
  return (
    <Stagger className="grid grid-cols-1 border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
      {SERVICES.map((service) => (
        <ServiceCell key={service.index} service={service} />
      ))}
    </Stagger>
  );
}
