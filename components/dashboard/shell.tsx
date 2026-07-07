"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { CLIENT, LIVE_TICKER } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { easeLux } from "@/lib/motion";
import { Logo } from "@/components/site/logo";

const NAV = [
  { label: "Tableau de bord", href: "#apercu", icon: LayoutDashboard },
  { label: "Immeubles", href: "#immeubles", icon: Building2 },
  { label: "Analyse IA", href: "#analyse-ia", icon: Sparkles },
  { label: "Activité", href: "#activite", icon: Activity },
  { label: "Documents", href: "#", icon: FileText },
  { label: "Paramètres", href: "#", icon: Settings },
];

function NavList({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (href: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const isActive = item.href === active;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => onSelect(item.href)}
            className={cn(
              "group flex items-center gap-3 rounded-[3px] px-3.5 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-paper text-ink"
                : "text-ash hover:bg-paper/10 hover:text-paper"
            )}
          >
            <item.icon className="size-[1.05rem]" strokeWidth={1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (href: string) => void;
}) {
  const router = useRouter();
  const { signOut, isAdmin } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace("/connexion");
  }

  return (
    <div className="flex h-full flex-col bg-noir text-paper">
      <div className="grid-faint absolute inset-0 opacity-30" aria-hidden />
      <div className="relative flex items-center gap-2 px-6 py-6">
        <Link href="/" className="text-paper">
          <Logo subtitle={false} />
        </Link>
      </div>

      <div className="relative flex-1 overflow-y-auto px-4">
        <p className="kicker px-3.5 pb-3 pt-2 text-ash/70">Navigation</p>
        <NavList active={active} onSelect={onSelect} />
      </div>

      <div className="relative border-t border-line-dark p-4">
        {isAdmin && (
          <Link
            href="/admin"
            className="mb-3 flex items-center gap-3 rounded-[3px] border border-line-dark bg-paper/5 px-3.5 py-2.5 text-sm text-ash transition-colors hover:bg-paper/10 hover:text-paper"
          >
            <ShieldCheck className="size-[1.05rem]" strokeWidth={1.6} />
            Zone admin
          </Link>
        )}
        <div className="rounded-[4px] border border-line-dark bg-ink-2/60 p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper font-[family-name:var(--font-jetbrains)] text-xs text-ink">
              GV
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-paper">{CLIENT.name}</p>
              <p className="truncate text-xs text-ash">Client depuis {CLIENT.since}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-line-dark pt-3 text-xs text-ash">
            <p>
              Gestionnaire ·{" "}
              <span className="text-paper/80">{CLIENT.advisor}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center gap-3 rounded-[3px] px-3.5 py-2.5 text-left text-sm text-ash transition-colors hover:bg-paper/10 hover:text-paper"
        >
          <LogOut className="size-[1.05rem]" strokeWidth={1.6} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function LiveTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % LIVE_TICKER.length), 3800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden min-w-0 items-center gap-2.5 rounded-full border border-line bg-paper px-3.5 py-1.5 md:flex">
      <span className="live-dot inline-block size-1.5 shrink-0 rounded-full bg-ink" />
      <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">En direct</span>
      <span className="h-3.5 w-px bg-line" />
      <div className="relative h-4 w-[clamp(12rem,24vw,22rem)] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.5, ease: easeLux }}
            className="absolute inset-0 truncate text-xs text-ink/80"
          >
            {LIVE_TICKER[i]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("#apercu");

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const select = (href: string) => {
    if (href !== "#") setActive(href);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-[100svh] bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] overflow-hidden lg:block">
        <SidebarInner active={active} onSelect={select} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-noir/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[280px] overflow-hidden lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: easeLux }}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="absolute right-3 top-5 z-10 inline-flex size-9 items-center justify-center rounded-[3px] text-ash hover:bg-paper/10 hover:text-paper"
              >
                <X className="size-5" />
              </button>
              <SidebarInner active={active} onSelect={select} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content column */}
      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
                className="inline-flex size-9 items-center justify-center rounded-[3px] text-ink hover:bg-ink/5 lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="truncate font-display text-xl leading-none tracking-tight md:text-2xl">
                    Tableau de bord
                  </h1>
                  <span
                    title="Données de démonstration — les vraies données s'afficheront une fois PlexFlow connecté."
                    className="hidden shrink-0 rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-smoke sm:inline"
                  >
                    Démonstration
                  </span>
                </div>
                <p className="mt-1 hidden text-xs text-smoke sm:block">
                  {CLIENT.portfolioName} · 16 juin 2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LiveTicker />
              <button
                type="button"
                aria-label="Notifications"
                className="relative inline-flex size-9 items-center justify-center rounded-[3px] border border-line text-ink transition-colors hover:bg-paper-2"
              >
                <Bell className="size-[1.05rem]" strokeWidth={1.6} />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-ink" />
              </button>
              <span className="flex size-9 items-center justify-center rounded-full bg-ink font-[family-name:var(--font-jetbrains)] text-xs text-paper">
                GV
              </span>
            </div>
          </div>
        </header>

        <main className="px-5 py-6 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}
