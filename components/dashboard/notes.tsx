"use client";

import { useState } from "react";
import { Loader2, Send, StickyNote } from "lucide-react";

export type NoteMeta = {
  id: string;
  title: string;
  body: string;
  from: "manager" | "client";
  author?: string;
  createdAt: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function NotesSection({
  notes,
  onSend,
}: {
  notes: NoteMeta[];
  onSend?: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSend || !text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text.trim());
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="notes" className="scroll-mt-24 rounded-[4px] border border-line bg-white p-6 text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Notes</h2>
          <p className="mt-1 text-xs text-smoke">Échanges avec votre gestionnaire</p>
        </div>
        {notes.length > 0 && (
          <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">{notes.length}</span>
        )}
      </div>

      {onSend && (
        <form onSubmit={submit} className="mt-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Écrire une note à votre gestionnaire…"
            className="w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Envoyer
          </button>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="mt-5 rounded-[2px] border border-dashed border-line bg-paper-2/40 px-4 py-8 text-center text-sm text-smoke">
          Aucune note pour l'instant.
        </p>
      ) : (
        <ul className="mt-5 flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1">
          {notes.map((n) => {
            const mine = n.from === "client";
            return (
              <li
                key={n.id}
                className={`rounded-[3px] border p-4 ${mine ? "border-line bg-white" : "border-line bg-paper-2/40"}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[3px] border text-xs font-medium ${mine ? "border-ink bg-ink text-paper" : "border-line bg-white text-smoke"}`}>
                    {mine ? "Moi" : <StickyNote className="size-4" strokeWidth={1.6} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-medium uppercase tracking-wide text-smoke/70">
                      {mine ? "Vous" : "Votre gestionnaire"}
                    </p>
                    {n.title && <p className="mt-0.5 font-medium text-ink">{n.title}</p>}
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-smoke">{n.body}</p>
                    <p className="mt-2 text-[0.7rem] uppercase tracking-wide text-smoke/60">{fmtDate(n.createdAt)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
