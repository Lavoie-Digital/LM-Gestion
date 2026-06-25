"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Globe,
  Loader2,
  Minus,
  ScanText,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  NEIGHBORHOODS,
  UNIT_TYPES,
  type MarketResult,
} from "@/lib/market";
import { cn, formatCAD } from "@/lib/utils";
import { easeLux } from "@/lib/motion";

type Status = "idle" | "loading" | "done" | "error";

/* ---- segmented selector ---- */
function Segmented<T extends { id: string; label: string }>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: readonly T[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mono mb-2 text-[0.55rem] uppercase tracking-[0.16em] text-ash">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-[4px] border px-3.5 py-2 text-sm transition-colors disabled:opacity-50",
              o.id === value
                ? "border-paper/40 bg-paper/[0.08] text-paper"
                : "border-line-dark text-ash hover:border-paper/20 hover:text-paper/90"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- result panel ---- */
function ResultView({ result }: { result: MarketResult }) {
  if (result.sampleSize === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[16rem] flex-col items-center justify-center px-6 py-10 text-center"
      >
        <p className="font-display text-xl tracking-tight text-paper">Aucune annonce trouvée</p>
        <p className="mt-2 max-w-sm text-sm text-ash">{result.summary}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeLux }}
      className="p-6"
    >
      {/* headline */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-ash">
            Loyer du marché · {result.unitTypeLabel} · {result.neighborhoodLabel}
          </p>
          <p className="mt-2 font-display text-[clamp(2.4rem,5vw,3.4rem)] font-light leading-none tracking-tight text-paper tabular">
            {formatCAD(result.marketPrice)}
            <span className="ml-2 align-baseline text-base text-ash">/ mois</span>
          </p>
          <p className="mt-3 text-sm text-ash">
            Fourchette {formatCAD(result.low)} – {formatCAD(result.high)} ·{" "}
            <span className="inline-flex items-center gap-1 text-paper/90">
              <TrendingUp className="size-3.5" /> médiane {formatCAD(result.median)}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-[4px] border border-line-dark px-4 py-3 text-right">
            <p className="mono text-[0.5rem] uppercase tracking-wide text-ash">Annonces</p>
            <p className="mt-1 font-display text-2xl tracking-tight text-paper tabular">
              {result.sampleSize}
            </p>
          </div>
          <div className="rounded-[4px] border border-line-dark px-4 py-3 text-right">
            <p className="mono text-[0.5rem] uppercase tracking-wide text-ash">Demande</p>
            <p className="mt-1 font-display text-2xl tracking-tight text-paper">{result.demand}</p>
          </div>
        </div>
      </div>

      {/* summary */}
      <p className="mt-6 text-pretty text-sm leading-relaxed text-ash">{result.summary}</p>

      {/* drivers */}
      {result.drivers.length > 0 && (
        <div className="mt-6">
          <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-ash">Facteurs de prix</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.drivers.map((d) => (
              <li
                key={d.label}
                className="inline-flex items-center gap-2 rounded-full border border-line-dark px-3 py-1.5 text-xs text-paper/85"
              >
                {d.impact === "up" ? (
                  <ArrowUp className="size-3 text-paper" />
                ) : d.impact === "down" ? (
                  <ArrowDown className="size-3 text-ash" />
                ) : (
                  <Minus className="size-3 text-ash" />
                )}
                {d.label}
                {d.note && <span className="text-ash">· {d.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* comps */}
      <div className="mt-8">
        <p className="mono mb-3 text-[0.6rem] uppercase tracking-[0.16em] text-ash">
          Annonces comparables (sources Web)
        </p>
        <div className="overflow-x-auto rounded-[4px] border border-line-dark">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-dark text-[0.55rem] uppercase tracking-[0.12em] text-ash">
                <th className="px-4 py-3 font-medium">Annonce</th>
                <th className="px-4 py-3 text-right font-medium">Loyer</th>
              </tr>
            </thead>
            <tbody>
              {result.comps.map((c, i) => (
                <tr key={i} className="border-b border-line-dark/60 last:border-0">
                  <td className="px-4 py-3">
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-paper/90 underline-offset-2 hover:underline"
                      >
                        {c.title}
                      </a>
                    ) : (
                      <span className="text-paper/90">{c.title}</span>
                    )}
                    {c.location && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ash">
                        <Globe className="size-3" /> {c.location}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-paper/90 tabular">
                    {formatCAD(c.price)}
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

/* ---- intelligent staged loader ---- */
const LOADING_STEPS = [
  { icon: Search, label: "Recherche des annonces en ligne" },
  { icon: ScanText, label: "Lecture IA des pages trouvées" },
  { icon: Sparkles, label: "Analyse du marché par l'IA" },
];

function LoadingView() {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    // Avance régulièrement jusqu'à ~96 % (la requête réelle prend ~8-15 s) ;
    // le parent retire ce loader dès que la réponse arrive.
    const id = setInterval(() => {
      setProgress((p) => (p >= 96 ? 96 : p + 1));
    }, 150);
    return () => clearInterval(id);
  }, []);

  const active = progress < 34 ? 0 : progress < 76 ? 1 : 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[18rem] flex-col justify-center px-6 py-10"
    >
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-3 text-paper">
          <Loader2 className="size-5 animate-spin" />
          <span className="font-display text-xl tracking-tight">Analyse du marché en cours…</span>
        </div>

        <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-paper/10">
          <motion.div
            className="h-full rounded-full bg-paper"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.15 }}
          />
        </div>
        <div className="mt-2 text-right font-[family-name:var(--font-jetbrains)] text-[0.65rem] uppercase tracking-wider text-ash">
          {progress} %
        </div>

        <ul className="mt-7 flex flex-col gap-3">
          {LOADING_STEPS.map((step, i) => {
            const done = i < active;
            const isActive = i === active;
            const Icon = step.icon;
            return (
              <li
                key={step.label}
                className={cn(
                  "flex items-center gap-3 text-sm transition-colors",
                  done ? "text-paper/80" : isActive ? "text-paper" : "text-ash/50"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border transition-colors",
                    done
                      ? "border-paper/40 bg-paper/10"
                      : isActive
                        ? "border-paper/50"
                        : "border-line-dark"
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" />
                  ) : isActive ? (
                    <Icon className="size-3.5 animate-pulse" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </span>
                {step.label}
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}

export function AiAnalysis() {
  const [neighborhoodId, setNeighborhoodId] = useState(NEIGHBORHOODS[0].id);
  const [unitTypeId, setUnitTypeId] = useState(UNIT_TYPES[1].id);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<MarketResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loading = status === "loading";

  async function runAnalysis() {
    setStatus("loading");
    setError(null);
    const t0 = performance.now();
    const tag = "[analyse-marché]";
    console.log(`${tag} ▶ Lancement`, { neighborhoodId, unitTypeId });
    try {
      const res = await fetch("/api/market-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ neighborhoodId, unitTypeId }),
      });
      const ms = Math.round(performance.now() - t0);
      const data = await res.json();
      console.log(`${tag} Réponse HTTP ${res.status} en ${ms} ms`);
      if (!res.ok) throw new Error(data.error || "L'analyse a échoué.");

      const r = data as MarketResult;
      console.log(
        `${tag} ✔ ${r.neighborhoodLabel} · ${r.unitTypeLabel} — loyer marché ${r.marketPrice} $/mois`,
        {
          médiane: r.median,
          fourchette: `${r.low}–${r.high} $`,
          annonces: r.sampleSize,
          demande: r.demand,
        }
      );
      console.log(`${tag} Résumé :`, r.summary);
      if (r.comps?.length) {
        console.log(`${tag} ${r.comps.length} annonce(s) comparable(s) :`);
        console.table(
          r.comps.map((c) => ({
            prix: c.price,
            source: c.location ?? "",
            titre: c.title,
            url: c.url ?? "",
          }))
        );
      }
      console.log(`${tag} Objet complet :`, r);

      setResult(r);
      setStatus("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inattendue.";
      console.error(`${tag} ✖ Échec :`, msg);
      setError(msg);
      setStatus("error");
    }
  }

  return (
    <section
      id="analyse-ia"
      className="scroll-mt-24 overflow-hidden rounded-[6px] border border-line-dark bg-noir text-paper"
    >
      {/* header */}
      <div className="border-b border-line-dark p-6">
        <p className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] text-paper/80">
          <Sparkles className="size-3.5" /> Analyse de marché · IA
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.2rem)] tracking-tight">
          Le juste loyer, secteur par secteur.
        </h2>
        <p className="mt-2 max-w-xl text-sm text-ash">
          Choisissez un quartier et un type de logement. Notre IA agrège les annonces de location
          publiées en ligne (LesPAC, Logis Québec, DuProprio, Centris…) et estime le prix du marché.
        </p>
      </div>

      {/* controls */}
      <div className="flex flex-col gap-5 border-b border-line-dark p-6">
        <Segmented
          label="Quartier"
          options={NEIGHBORHOODS}
          value={neighborhoodId}
          onChange={setNeighborhoodId}
          disabled={loading}
        />
        <Segmented
          label="Type de logement"
          options={UNIT_TYPES}
          value={unitTypeId}
          onChange={setUnitTypeId}
          disabled={loading}
        />
        <div>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-[4px] bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            {loading ? "Analyse en cours…" : "Analyser le marché"}
          </button>
        </div>
      </div>

      {/* result */}
      <div className="min-h-[12rem]">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[12rem] items-center justify-center px-6 py-10 text-center text-sm text-ash"
            >
              Lancez une analyse pour afficher le prix du marché.
            </motion.div>
          )}

          {loading && <LoadingView key="loading" />}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-6 py-10 text-center"
            >
              <p className="font-display text-lg tracking-tight text-paper">Analyse impossible</p>
              <p className="max-w-sm text-sm text-ash">{error}</p>
              <button
                type="button"
                onClick={runAnalysis}
                className="mt-2 rounded-[3px] border border-paper/25 px-3.5 py-2 text-xs font-medium text-paper transition-colors hover:bg-paper hover:text-ink"
              >
                Réessayer
              </button>
            </motion.div>
          )}

          {status === "done" && result && <ResultView key="done" result={result} />}
        </AnimatePresence>
      </div>
    </section>
  );
}
