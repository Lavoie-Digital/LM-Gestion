"use client";

import { useState } from "react";
import { CornerDownRight, Download, Loader2, Paperclip, Send, StickyNote, X } from "lucide-react";

export type NoteAttachment = { name: string; contentType: string; size: number; url?: string };

export type NoteMeta = {
  id: string;
  title: string;
  body: string;
  from: "manager" | "client";
  author?: string;
  status?: "sent" | "scheduled";
  scheduledFor?: string | null;
  parentId?: string | null;
  attachments?: NoteAttachment[];
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
  roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return roots.map((root) => ({
    root,
    replies: (repliesByRoot.get(root.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}

function Attachments({ items }: { items?: NoteAttachment[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((a, i) =>
        a.url ? (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink hover:border-ink"
          >
            <Paperclip className="size-3 shrink-0" />
            <span className="truncate">{a.name}</span>
            <Download className="size-3 shrink-0 text-smoke" />
          </a>
        ) : (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-smoke">
            <Paperclip className="size-3" /> {a.name}
          </span>
        )
      )}
    </div>
  );
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
        {n.body && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-smoke">{n.body}</p>}
        <Attachments items={n.attachments} />
        <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-smoke/60">{fmtDate(n.createdAt)}</p>
      </div>
    </div>
  );
}

/** Sélecteur de fichiers réutilisable (bouton trombone + pastilles). */
export function FilePicker({ files, setFiles }: { files: File[]; setFiles: (f: File[]) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-line px-2.5 py-1.5 text-xs text-ink hover:bg-paper-2">
        <Paperclip className="size-3.5" /> Joindre
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            setFiles([...files, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </label>
      {files.map((f, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2.5 py-1 text-xs text-ink">
          {f.name}
          <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-smoke hover:text-red-600" aria-label="Retirer">
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function NotesSection({
  notes,
  onSend,
}: {
  notes: NoteMeta[];
  /** onSend(texte, parentId?, fichiers?) — parentId présent = réponse dans un fil. */
  onSend?: (text: string, parentId?: string, files?: File[]) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyBusy, setReplyBusy] = useState(false);

  const threads = buildThreads(notes);

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!onSend || (!text.trim() && files.length === 0) || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text.trim(), undefined, files);
      setText("");
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  async function submitReply(rootId: string) {
    if (!onSend || (!replyText.trim() && replyFiles.length === 0) || replyBusy) return;
    setReplyBusy(true);
    setError(null);
    try {
      await onSend(replyText.trim(), rootId, replyFiles);
      setReplyText("");
      setReplyFiles([]);
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={sending || (!text.trim() && files.length === 0)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Envoyer
            </button>
            <FilePicker files={files} setFiles={setFiles} />
          </div>
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
                      <FilePicker files={replyFiles} setFiles={setReplyFiles} />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => submitReply(root.id)} disabled={replyBusy || (!replyText.trim() && replyFiles.length === 0)} className="inline-flex h-8 items-center gap-1.5 rounded-[2px] bg-ink px-3 text-xs font-medium text-paper disabled:opacity-50">
                          {replyBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Répondre
                        </button>
                        <button type="button" onClick={() => { setReplyOpen(null); setReplyText(""); setReplyFiles([]); }} className="text-xs text-smoke hover:text-ink">
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setReplyOpen(root.id); setReplyText(""); setReplyFiles([]); }} className="inline-flex items-center gap-1.5 text-xs text-smoke hover:text-ink">
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
