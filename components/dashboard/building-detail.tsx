"use client";

import { AnimatePresence, motion } from "motion/react";
import { Mail, Phone, X } from "lucide-react";
import { formatCAD } from "@/lib/utils";
import { easeLux } from "@/lib/motion";

export type DetailUnit = {
  unitId: string;
  label: string;
  unitType?: string | number;
  currentRentCents: number;
  marketPriceCents?: number | null;
  address?: string;
  tenants?: string;
  tenantsEmails?: string;
  tenantsPhones?: string;
  dateAvailableForRent?: string;
  markedWontRenew: boolean;
};

function fmtType(t?: string | number): string {
  if (t === undefined || t === null || t === "") return "—";
  const n = typeof t === "number" ? t : Number(t);
  if (!Number.isFinite(n) || n <= 0) return String(t);
  const whole = Math.floor(n);
  return n - whole >= 0.5 ? `${whole}½` : String(whole);
}
function fmtDate(d?: string): string | null {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
}

export function BuildingDetail({
  title,
  subtitle,
  units,
  onClose,
}: {
  title: string;
  subtitle?: string;
  units: DetailUnit[];
  onClose: () => void;
}) {
  const revenue = units.reduce((s, u) => s + (u.currentRentCents || 0), 0);
  const toRelet = units.filter((u) => u.markedWontRenew).length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex justify-end bg-noir/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.aside
          className="flex h-full w-full max-w-2xl flex-col bg-paper shadow-2xl"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.4, ease: easeLux }}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl tracking-tight text-ink">{title}</h2>
              {subtitle && <p className="mt-1 truncate text-sm text-smoke">{subtitle}</p>}
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-smoke">
                <span><span className="font-medium text-ink tabular">{units.length}</span> logement{units.length > 1 ? "s" : ""}</span>
                <span><span className="font-medium text-ink tabular">{formatCAD(Math.round(revenue / 100))}</span> / mois</span>
                {toRelet > 0 && <span><span className="font-medium text-ink tabular">{toRelet}</span> à relouer</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-[3px] text-smoke hover:bg-paper-2 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <ul className="flex flex-col gap-3">
              {units.map((u) => {
                const avail = fmtDate(u.dateAvailableForRent);
                return (
                  <li key={u.unitId} className="rounded-[3px] border border-line bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          Logement {u.label}
                          <span className="ml-2 text-xs font-normal text-smoke">{fmtType(u.unitType)}</span>
                        </p>
                        {u.address && <p className="mt-0.5 truncate text-xs text-smoke">{u.address}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-medium text-ink tabular">{formatCAD(Math.round((u.currentRentCents || 0) / 100))}</p>
                        {typeof u.marketPriceCents === "number" && u.marketPriceCents > 0 && (
                          <p className="text-[0.7rem] text-smoke">marché {formatCAD(Math.round(u.marketPriceCents / 100))}</p>
                        )}
                      </div>
                    </div>

                    {(u.tenants || u.markedWontRenew || avail) && (
                      <div className="mt-3 border-t border-line-soft pt-3 text-xs">
                        {u.tenants && <p className="text-ink/80">Locataire{u.tenants.includes(",") ? "s" : ""} : {u.tenants}</p>}
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-smoke">
                          {u.tenantsEmails && (
                            <span className="inline-flex items-center gap-1"><Mail className="size-3" /> {u.tenantsEmails}</span>
                          )}
                          {u.tenantsPhones && (
                            <span className="inline-flex items-center gap-1"><Phone className="size-3" /> {u.tenantsPhones}</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {u.markedWontRenew && (
                            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[0.65rem] font-medium text-ink">Non renouvelé</span>
                          )}
                          {avail && (
                            <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] text-smoke">Dispo. {avail}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
