"use client";

import { Download, FileText } from "lucide-react";

export type DocMeta = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  url?: string;
};

function fmtSize(bytes: number): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function DocumentsSection({ docs }: { docs: DocMeta[] }) {
  return (
    <section id="documents" className="scroll-mt-24 rounded-[4px] border border-line bg-white p-6 text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Documents</h2>
          <p className="mt-1 text-xs text-smoke">Bilans, rapports et pièces déposés par votre gestionnaire</p>
        </div>
        {docs.length > 0 && (
          <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">{docs.length} fichier{docs.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {docs.length === 0 ? (
        <p className="mt-6 rounded-[2px] border border-dashed border-line bg-paper-2/40 px-4 py-8 text-center text-sm text-smoke">
          Aucun document pour l'instant. Vous serez notifié par courriel dès qu'un nouveau document sera disponible.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col divide-y divide-line-soft">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-4 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[3px] border border-line bg-paper-2/60 text-smoke">
                <FileText className="size-5" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                <p className="mt-0.5 text-xs text-smoke">
                  {fmtDate(d.uploadedAt)}
                  {fmtSize(d.size) ? ` · ${fmtSize(d.size)}` : ""}
                </p>
              </div>
              {d.url && (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[2px] border border-line px-3.5 text-sm text-ink transition-colors hover:bg-paper-2"
                >
                  <Download className="size-4" /> Télécharger
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
