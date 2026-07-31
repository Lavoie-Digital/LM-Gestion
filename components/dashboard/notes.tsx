"use client";

import { useState } from "react";
import { CornerDownRight, Loader2, Send, StickyNote } from "lucide-react";

export type NoteMeta = {
  id: string;
  title: string;
  body: string;
  from: "manager" | "client";
  author?: string;
  status?: "sent" | "scheduled";
  scheduledFor?: string | null;
  parentId?: string | null;
  createdAt: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Regroupe en fils : racines (sans parentId) + leurs réponses. */
export function buildThreads(notes: NoteMeta[]) {
  const byId = new Map(notes.map((n) => [n.id, n]));
  const repliesByRoot = new Map<string, NoteMeta[]>();
  const roots: NoteMeta[] = [];
  for (const n of notes) {
    if (n.parentId && byId.has(n.parentId)) {
      const arr = repliesByRoot.get(n.parentId) ?? [];
      arr.push(n);
      repliesByRoot.set(n.parentId, arr);
    } else {
      roots.push(n);
    }
  }
  roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // fil le plus récent en premier
  return roots.map((root) => ({
    root,
    replies: (repliesByRoot.get(root.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}

function Bubble({ n }: { n: NoteMeta }) {
  const mine = n.from === "client";
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[3px] border text-[0.65rem] font-medium ${mine ? "border-ink bg-ink text-paper" : "border-line bg-white text-smoke"}`}>
        {mine ? "Moi" : <StickyNote className="size-4" strokeWidth={1.6} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-smoke/70">{mine ? "Vous" : "Votre gestionnaire"}</p>
        {n.title && <p className="mt-0.5 font-medium text-ink">{n.title}</p>}
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-smoke">{n.body}</p>
        <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-smoke/60">{fmtDate(n.createdAt)}</p>
      </div>
    </div>
  );
}

export function NotesSection({
  notes,
  onSend,
}: {
  notes: NoteMeta[];
  /** onSend(texte, parentId?) — parentId présent = réponse dans un fil existant. */
  onSend?: (text: string, parentId?: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  const threads = buildThreads(notes);

  async function submitNew(e: React.FormEvent) {
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

  async function submitReply(rootId: string) {
    if (!onSend || !replyText.trim() || replyBusy) return;
    setReplyBusy(true);
    setError(null);
    try {
      await onSend(replyText.trim(), rootId);
      setReplyText("");
      setReplyOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setReplyBusy(false);
    }
  }

  return (
    <section id="notes" className="scroll-mt-24 rounded-[4px] border border-line bg-white p-6 text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Notes</h2>
          <p className="mt-1 text-xs text-smoke">Échanges avec votre gestionnaire</p>
        </div>
        {notes.length > 0 && <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">{threads.length} sujet{threads.length > 1 ? "s" : ""}</span>}
      </div>

      {/* Nouveau sujet */}
      {onSend && (
        <form onSubmit={submitNew} className="mt-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Écrire une nouvelle note à votre gestionnaire…"
            className="w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={sending || !text.trim()} className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Envoyer
          </button>
        </form>
      )}

      {threads.length === 0 ? (
        <p className="mt-5 rounded-[2px] border border-dashed border-line bg-paper-2/40 px-4 py-8 text-center text-sm text-smoke">
          Aucune note pour l'instant.
        </p>
      ) : (
        <ul className="mt-5 flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1">
          {threads.map(({ root, replies }) => (
            <li key={root.id} className="rounded-[3px] border border-line bg-paper-2/20 p-4">
              <Bubble n={root} />

              {replies.length > 0 && (
                <div className="mt-3 flex flex-col gap-3 border-l-2 border-line pl-4">
                  {replies.map((rep) => (
                    <Bubble key={rep.id} n={rep} />
                  ))}
                </div>
              )}

              {onSend && (
                <div className="mt-3">
                  {replyOpen === root.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder="Votre réponse…"
                        className="w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                      />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => submitReply(root.id)} disabled={replyBusy || !replyText.trim()} className="inline-flex h-8 items-center gap-1.5 rounded-[2px] bg-ink px-3 text-xs font-medium text-paper disabled:opacity-50">
                          {replyBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Répondre
                        </button>
                        <button type="button" onClick={() => { setReplyOpen(null); setReplyText(""); }} className="text-xs text-smoke hover:text-ink">
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setReplyOpen(root.id); setReplyText(""); }} className="inline-flex items-center gap-1.5 text-xs text-smoke hover:text-ink">
                      <CornerDownRight className="size-3.5" /> Répondre
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
