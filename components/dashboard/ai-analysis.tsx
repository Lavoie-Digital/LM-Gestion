"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AI_SUMMARY, VACANT_UNITS, type VacantUnit } from "@/lib/data";
import { cn, formatCAD } from "@/lib/utils";
import { easeLux } from "@/lib/motion";
import { AnimatedNumber } from "@/components/ui/animated-number";

const STEPS = [
  "Lecture des annonces comparables du marché",
  "Analyse des annonces du secteur",
  "Filtrage des comparables pertinents",
  "Calcul du potentiel de revenu",
];
const STEP_AT = [8, 38, 68, 92];
const pct = (n: number) => `${n.toFixed(1).replace(".", ",")} %`;

/* ---- left list ---- */
function UnitButton({
  unit,
  active,
  onClick,
}: {
  unit: VacantUnit;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[4px] border p-4 text-left transition-colors duration-300",
        active
          ? "border-paper/30 bg-paper/[0.06]"
          : "border-line-dark hover:border-paper/20 hover:bg-paper/[0.03]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-paper">
          {unit.building} <span className="text-ash">{unit.unit}</span>
        </span>
        <span className="mono shrink-0 rounded-full border border-line-dark px-2 py-0.5 text-[0.55rem] uppercase tracking-wide text-ash">
          {unit.type}
        </span>
      </div>
      <div className="mt-2.5 flex items-end justify-between">
        <span className="text-xs text-ash">Vacant depuis {unit.vacantDays} j</span>
        <span className="inline-flex items-center gap-1 font-[family-name:var(--font-jetbrains)] text-xs text-paper/90">
          <ArrowUp className="size-3" />
          {formatCAD(unit.ai.target)}
          <span className="text-ash">/mois</span>
        </span>
      </div>
    </button>
  );
}

/* ---- scanning overlay ---- */
function ScanOverlay({ progress }: { progress: number }) {
  const scanned = Math.round((progress / 100) * AI_SUMMARY.listingsScanned);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[26rem] flex-col justify-center px-6 py-10"
    >
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-3 text-paper">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-display text-xl tracking-tight">Analyse du marché en cours…</span>
        </div>

        <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-paper/10">
          <motion.div
            className="h-full rounded-full bg-paper"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between font-[family-name:var(--font-jetbrains)] text-[0.65rem] uppercase tracking-wider text-ash">
          <span>{scanned.toLocaleString("fr-CA")} / {AI_SUMMARY.listingsScanned.toLocaleString("fr-CA")} annonces</span>
          <span>{Math.round(progress)} %</span>
        </div>

        <ul className="mt-7 flex flex-col gap-3">
          {STEPS.map((step, i) => {
            const done = progress >= STEP_AT[i] + 6;
            const active = progress >= STEP_AT[i] && !done;
            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-3 text-sm transition-colors",
                  done ? "text-paper/85" : active ? "text-paper" : "text-ash/50"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border",
                    done
                      ? "border-paper/40 bg-paper/10"
                      : active
                        ? "border-paper/40"
                        : "border-line-dark"
                  )}
                >
                  {done ? (
                    <Check className="size-3" />
                  ) : active ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : null}
                </span>
                {step}
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}

/* ---- result detail ---- */
function Detail({ unit }: { unit: VacantUnit }) {
  const ai = unit.ai;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easeLux }}
      className="p-6"
    >
      {/* headline numbers */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-ash">
            Loyer recommandé · {unit.building} {unit.unit}
          </p>
          <p className="mt-2 font-display text-[clamp(2.4rem,5vw,3.5rem)] font-light leading-none tracking-tight text-paper tabular">
            <AnimatedNumber value={ai.target} format={formatCAD} />
            <span className="ml-2 align-baseline text-base text-ash">/ mois</span>
          </p>
          <p className="mt-3 text-sm text-ash">
            Fourchette {formatCAD(ai.recommendedLow)} – {formatCAD(ai.recommendedHigh)} ·{" "}
            <span className="inline-flex items-center gap-1 text-paper/90">
              <TrendingUp className="size-3.5" /> +{pct(ai.marketDelta)} vs dernier loyer (
              {formatCAD(unit.lastRent)})
            </span>
          </p>
        </div>

        <div className="rounded-[4px] border border-paper/20 bg-paper/[0.04] px-5 py-4 text-right">
          <p className="mono text-[0.55rem] uppercase tracking-[0.16em] text-ash">
            Potentiel annuel
          </p>
          <p className="mt-1.5 font-display text-2xl tracking-tight text-paper tabular">
            <AnimatedNumber value={ai.potentialAnnual} format={formatCAD} />
          </p>
        </div>
      </div>

      {/* metrics row */}
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[4px] border border-line-dark p-4">
          <p className="inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-wide text-ash">
            <Gauge className="size-3" /> Confiance IA
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper/10">
              <div className="h-full rounded-full bg-paper" style={{ width: `${ai.confidence}%` }} />
            </div>
            <span className="font-[family-name:var(--font-jetbrains)] text-xs text-paper">
              {ai.confidence} %
            </span>
          </div>
        </div>
        <div className="rounded-[4px] border border-line-dark p-4">
          <p className="inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-wide text-ash">
            <Clock className="size-3" /> Location estimée
          </p>
          <p className="mt-2 font-display text-xl tracking-tight text-paper">
            {ai.daysToLease} <span className="text-sm text-ash">jours</span>
          </p>
        </div>
        <div className="col-span-2 rounded-[4px] border border-line-dark p-4 sm:col-span-1">
          <p className="text-[0.6rem] uppercase tracking-wide text-ash">Demande du marché</p>
          <p className="mt-2 font-display text-xl tracking-tight text-paper">{ai.demand}</p>
        </div>
      </div>

      {/* summary */}
      <p className="mt-6 text-pretty text-sm leading-relaxed text-ash">{ai.summary}</p>

      {/* drivers */}
      <div className="mt-6">
        <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-ash">
          Facteurs de prix
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ai.drivers.map((d) => (
            <li
              key={d.label}
              className="inline-flex items-center gap-2 rounded-full border border-line-dark px-3 py-1.5 text-xs text-paper/85"
            >
              {d.impact === "up" ? (
                <ArrowUp className="size-3 text-paper" />
              ) : (
                <ArrowDown className="size-3 text-ash" />
              )}
              {d.label}
              <span className="text-ash">· {d.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* comparables */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-ash">
            Comparables du marché
          </p>
          <span className="mono text-[0.55rem] uppercase tracking-wide text-ash/70">
            Analyse en continu
          </span>
        </div>
        <div className="overflow-x-auto rounded-[4px] border border-line-dark">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-dark text-[0.55rem] uppercase tracking-[0.12em] text-ash">
                <th className="px-4 py-3 font-medium">Annonce</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Loyer</th>
                <th className="px-4 py-3 text-right font-medium">Dist.</th>
                <th className="px-4 py-3 text-right font-medium">Corresp.</th>
              </tr>
            </thead>
            <tbody>
              {ai.comps.map((c, i) => (
                <tr key={i} className="border-b border-line-dark/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-paper/90">{c.title}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ash">
                      <MapPin className="size-3" /> {c.neighborhood} · publié il y a {c.postedDaysAgo} j
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ash">
                    {c.beds} · {c.sqft} pi²
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-paper/90 tabular">
                    {formatCAD(c.price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ash tabular">
                    {c.distanceKm.toFixed(1).replace(".", ",")} km
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-[family-name:var(--font-jetbrains)] text-xs text-paper">
                      {c.match} %
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

export function AiAnalysis() {
  const reduce = useReducedMotion();
  const [selectedId, setSelectedId] = useState(VACANT_UNITS[0].id);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selected = VACANT_UNITS.find((u) => u.id === selectedId) ?? VACANT_UNITS[0];

  const runAnalysis = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (reduce) {
      setProgress(100);
      setAnalyzing(false);
      return;
    }
    setAnalyzing(true);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (p < 65 ? 2.6 : 4.2);
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setAnalyzing(false);
          return 100;
        }
        return next;
      });
    }, 55);
  }, [reduce]);

  // auto-run once on mount
  useEffect(() => {
    runAnalysis();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runAnalysis]);

  function select(id: string) {
    setSelectedId(id);
    runAnalysis();
  }

  return (
    <section
      id="analyse-ia"
      className="relative scroll-mt-24 overflow-hidden rounded-[6px] border border-line-dark bg-noir text-paper"
    >
      <div className="grid-faint absolute inset-0 opacity-30" aria-hidden />

      {/* header */}
      <div className="relative flex flex-col gap-5 border-b border-line-dark p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] text-paper/80">
            <Sparkles className="size-3.5" /> Analyse IA · Potentiel des logements vacants
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.2rem)] tracking-tight">
            Révélez le revenu dormant de votre parc.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ash">
            Notre IA compare chaque logement vacant aux annonces comparables du marché
            pour recommander le juste loyer et estimer son potentiel.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <div className="rounded-[4px] border border-line-dark px-4 py-3">
            <p className="mono text-[0.5rem] uppercase tracking-wide text-ash">Potentiel mensuel</p>
            <p className="mt-1 font-display text-lg tracking-tight tabular">
              +{formatCAD(AI_SUMMARY.potentialMonthly)}
            </p>
          </div>
          <div className="rounded-[4px] border border-line-dark px-4 py-3">
            <p className="mono text-[0.5rem] uppercase tracking-wide text-ash">Logements</p>
            <p className="mt-1 font-display text-lg tracking-tight tabular">
              {AI_SUMMARY.prioritized}
              <span className="text-sm text-ash">/{AI_SUMMARY.vacantTotal}</span>
            </p>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="relative grid lg:grid-cols-[300px_1fr]">
        {/* unit list */}
        <div className="border-b border-line-dark p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="mono text-[0.55rem] uppercase tracking-[0.16em] text-ash">
              Logements priorisés
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {VACANT_UNITS.map((u) => (
              <div key={u.id} className="w-[230px] shrink-0 lg:w-auto">
                <UnitButton
                  unit={u}
                  active={u.id === selectedId}
                  onClick={() => select(u.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* detail / scan */}
        <div className="relative">
          {/* re-run control */}
          <div className="flex items-center justify-between border-b border-line-dark px-6 py-3">
            <span className="mono text-[0.55rem] uppercase tracking-[0.16em] text-ash">
              {analyzing ? "Traitement…" : "Analyse à jour"}
            </span>
            <button
              type="button"
              onClick={() => runAnalysis()}
              disabled={analyzing}
              className="inline-flex items-center gap-2 rounded-[3px] border border-paper/25 px-3.5 py-2 text-xs font-medium text-paper transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", analyzing && "animate-spin")} />
              {analyzing ? "Analyse…" : "Relancer l'analyse"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {analyzing ? (
              <ScanOverlay key="scan" progress={progress} />
            ) : (
              <Detail key={selected.id} unit={selected} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
