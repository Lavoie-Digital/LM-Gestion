"use client";

import { StickyNote } from "lucide-react";

export type NoteMeta = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function NotesSection({ notes }: { notes: NoteMeta[] }) {
  return (
    <section id="notes" className="scroll-mt-24 rounded-[4px] border border-line bg-white p-6 text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Notes</h2>
          <p className="mt-1 text-xs text-smoke">Messages de votre gestionnaire</p>
        </div>
        {notes.length > 0 && (
          <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">{notes.length} note{notes.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="mt-6 rounded-[2px] border border-dashed border-line bg-paper-2/40 px-4 py-8 text-center text-sm text-smoke">
          Aucune note pour l'instant. Votre gestionnaire vous écrira ici au besoin.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-[3px] border border-line bg-paper-2/30 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[3px] border border-line bg-white text-smoke">
                  <StickyNote className="size-4" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  {n.title && <p className="font-medium text-ink">{n.title}</p>}
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-smoke">{n.body}</p>
                  <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-smoke/70">{fmtDate(n.createdAt)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
