"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { DemoView } from "@/components/dashboard/demo-view";

/* Tableau de bord DÉMO — réservé aux admins, pour présentation publique.
   Données fictives, aucune donnée réelle. */
const DEMO_IDENTITY = { name: "Gestion Verdure inc.", secondary: "Démonstration", initials: "GV" };

export default function DemoDashboardPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/connexion");
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardShell live={false} identity={DEMO_IDENTITY}>
      <div className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-2.5 rounded-[3px] border border-line bg-paper-2/60 px-4 py-2.5 text-xs text-smoke">
          <span className="size-1.5 shrink-0 rounded-full bg-ink/50" />
          <span>
            <span className="font-medium text-ink">Mode démonstration</span> — données fictives, pour
            présentation. Aucune donnée client réelle.
          </span>
        </div>
        <DemoView />
      </div>
    </DashboardShell>
  );
}
