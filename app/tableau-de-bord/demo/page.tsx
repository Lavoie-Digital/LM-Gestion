"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { DemoView, DEMO_NOTIFICATIONS } from "@/components/dashboard/demo-view";

/* Tableau de bord DÉMO — PUBLIC (aperçu pour prospects). Données 100 % fictives. */
const DEMO_IDENTITY = { name: "Gestion Verdure inc.", secondary: "Démonstration", initials: "GV" };

export default function DemoDashboardPage() {
  return (
    <DashboardShell live={false} identity={DEMO_IDENTITY} notifications={DEMO_NOTIFICATIONS}>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-line bg-paper-2/60 px-4 py-3">
          <span className="flex items-center gap-2.5 text-xs text-smoke">
            <span className="size-1.5 shrink-0 rounded-full bg-ink/50" />
            <span>
              <span className="font-medium text-ink">Aperçu de démonstration</span> — données fictives.
              Voici l'espace que chaque propriétaire obtient avec LM Gestion Immobilière.
            </span>
          </span>
          <Link
            href="/contact"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[2px] bg-ink px-4 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            Obtenir mon espace client <ArrowRight className="size-4" />
          </Link>
        </div>
        <DemoView />
      </div>
    </DashboardShell>
  );
}
