import {
  CalendarClock,
  ClipboardCheck,
  DoorOpen,
  KeyRound,
  Sparkles,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ACTIVITY, type ActivityType } from "@/lib/data";

const ICONS: Record<ActivityType, LucideIcon> = {
  payment: Wallet,
  lease: KeyRound,
  maintenance: Wrench,
  notice: DoorOpen,
  visit: CalendarClock,
  ai: Sparkles,
  inspection: ClipboardCheck,
};

export type FeedItem = { type: ActivityType; title: string; detail: string; time: string };

export function ActivityFeed({
  items = ACTIVITY,
  emptyLabel,
}: {
  items?: FeedItem[];
  emptyLabel?: string;
}) {
  return (
    <section
      id="activite"
      className="flex h-full scroll-mt-24 flex-col rounded-[4px] border border-line bg-white"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <h2 className="font-display text-xl tracking-tight">Activité récente</h2>
        <span className="live-dot inline-block size-1.5 rounded-full bg-ink" />
      </div>

      {items.length === 0 && (
        <p className="flex-1 px-6 py-10 text-center text-sm text-smoke">
          {emptyLabel ?? "Aucune activité pour l'instant."}
        </p>
      )}
      <ul className="flex-1 divide-y divide-line-soft px-6">
        {items.map((a, i) => {
          const Icon = ICONS[a.type];
          return (
            <li key={i} className="flex items-start gap-3.5 py-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-ink/75">
                <Icon className="size-[0.95rem]" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-ink">{a.title}</p>
                <p className="mt-0.5 truncate text-xs text-smoke">{a.detail}</p>
              </div>
              <span className="mono shrink-0 whitespace-nowrap pt-0.5 text-[0.6rem] uppercase tracking-wide text-smoke/80">
                {a.time}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
