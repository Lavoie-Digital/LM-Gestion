"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, FileText, FolderPlus, Loader2, Paperclip, RotateCcw, Send, Sparkles, Upload, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; content: string };

const inputCls =
  "h-11 w-full rounded-[2px] border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

const QUICK = [
  "Résume ce document en points clés.",
  "Prépare une courte note pour le propriétaire.",
  "Extrais les montants, dates et échéances.",
];

const STEPS = ["Joindre le document", "Demander à Claude", "Déposer chez le client"];

function fmtSize(b: number) {
  const kb = b / 1024;
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}

export default function AssistantPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showOrig, setShowOrig] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryPdfUrl, setSummaryPdfUrl] = useState<string | null>(null);
  const [summaryPdfLoading, setSummaryPdfLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subaccounts, setSubaccounts] = useState<string[]>([]);
  const [depSub, setDepSub] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [depFolder, setDepFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [depositOk, setDepositOk] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/connexion");
  }, [loading, user, isAdmin, router]);

  // URL d'aperçu du fichier joint (nettoyée quand le fichier change).
  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      setShowPreview(false);
      return;
    }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await user!.getIdToken();
      return fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
    },
    [user]
  );

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    (async () => {
      try {
        const res = await authedFetch("/api/admin/subaccounts");
        const data = await res.json();
        setSubaccounts((data.subaccounts ?? []).map((s: { name: string }) => s.name));
      } catch {
        /* ignore */
      }
    })();
  }, [loading, user, isAdmin, authedFetch]);

  useEffect(() => {
    if (!depSub) return setFolders([]);
    (async () => {
      try {
        const res = await authedFetch(`/api/admin/documents?subaccount=${encodeURIComponent(depSub)}`);
        const data = await res.json();
        setFolders(Array.isArray(data.folders) ? data.folders : []);
      } catch {
        setFolders([]);
      }
    })();
  }, [depSub, authedFetch]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function ask(prompt: string) {
    if (sending || !prompt.trim()) return;
    const userMsg: Msg = { role: "user", content: prompt.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("messages", JSON.stringify(next));
      if (file) fd.append("file", file);
      const res = await authedFetch("/api/admin/assistant", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de l'assistant.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "(réponse vide)" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
      setMessages((m) => m.slice(0, -1));
      setInput(userMsg.content);
    } finally {
      setSending(false);
    }
  }

  async function createFolder() {
    const name = newFolder.trim();
    if (!name || !depSub) return;
    await authedFetch("/api/admin/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subaccount: depSub, name }),
    });
    setNewFolder("");
    setDepFolder(name);
    const res = await authedFetch(`/api/admin/documents?subaccount=${encodeURIComponent(depSub)}`);
    const data = await res.json();
    setFolders(Array.isArray(data.folders) ? data.folders : []);
  }

  const lastReply = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";

  async function toggleSummaryPreview() {
    const next = !showSummary;
    setShowSummary(next);
    if (!next || !lastReply) return;
    setSummaryPdfLoading(true);
    try {
      const res = await authedFetch("/api/admin/summary-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: lastReply, filename: file?.name }),
      });
      if (!res.ok) throw new Error("Aperçu impossible.");
      const blob = await res.blob();
      setSummaryPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setSummaryPdfUrl(null);
    } finally {
      setSummaryPdfLoading(false);
    }
  }

  async function doDeposit() {
    if (!depSub || !file) return;
    setConfirming(false);
    setDepositing(true);
    setError(null);
    const label = `${depSub}${depFolder ? ` › ${depFolder}` : ""}`;
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("subaccount", depSub);
      if (depFolder) fd.append("folder", depFolder);
      if (lastReply) fd.append("summary", lastReply);
      const res = await authedFetch("/api/admin/deposit", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error || "Dépôt impossible.");
      setDepositOk(`Déposé dans le dossier de ${label}. Le client a été notifié par courriel.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dépôt impossible.");
    } finally {
      setDepositing(false);
    }
  }

  function reset() {
    setStep(1);
    setFile(null);
    setMessages([]);
    setInput("");
    setDepSub("");
    setDepFolder("");
    setConfirming(false);
    setDepositOk(null);
    setError(null);
  }

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-[100svh] bg-paper text-ink">
      <header className="flex items-center gap-4 border-b border-line px-6 py-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
          <ArrowLeft className="size-4" /> Admin
        </Link>
        <span className="kicker inline-flex items-center gap-1.5 text-smoke">
          <Sparkles className="size-3.5" /> Assistant IA
        </span>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Fil d'étapes */}
        <ol className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n || depositOk;
            const active = step === n && !depositOk;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    done ? "border-ink bg-ink text-paper" : active ? "border-ink text-ink" : "border-line text-smoke"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : n}
                </span>
                <span className={`hidden text-xs sm:block ${active || done ? "text-ink" : "text-smoke"}`}>{label}</span>
                {n < STEPS.length && <span className="h-px flex-1 bg-line" />}
              </li>
            );
          })}
        </ol>

        {error && <p className="mb-4 rounded-[2px] border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

        {/* ---------------- Écran de succès ---------------- */}
        {depositOk ? (
          <div className="rounded-[4px] border border-green-300 bg-green-50 p-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-600 text-white">
              <Check className="size-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl tracking-tight text-ink">C'est déposé</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-green-800">{depositOk}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-ink px-5 text-sm font-medium text-paper"
            >
              <RotateCcw className="size-4" /> Traiter un autre document
            </button>
          </div>
        ) : (
          <>
            {/* ---------------- ÉTAPE 1 — Joindre ---------------- */}
            {step === 1 && (
              <div>
                <h1 className="font-display text-2xl tracking-tight">Étape 1 — Joindre le document</h1>
                <p className="mt-2 text-sm text-smoke">Choisissez la facture, le bail ou tout autre document à traiter.</p>

                {!file ? (
                  <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[4px] border-2 border-dashed border-line bg-white px-6 py-12 text-center transition-colors hover:border-ink">
                    <Upload className="size-8 text-smoke" />
                    <span className="text-sm font-medium text-ink">Cliquez pour choisir un fichier</span>
                    <span className="text-xs text-smoke">PDF, image ou texte · jusqu'à 15 Mo</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setFile(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                ) : (
                  <div className="mt-6 flex items-center gap-3 rounded-[4px] border border-line bg-white p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-[3px] border border-line bg-paper-2/60 text-smoke">
                      <FileText className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                      <p className="text-xs text-smoke">{fmtSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)} className="text-smoke hover:text-red-600" aria-label="Retirer">
                      <X className="size-5" />
                    </button>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={!file}
                    onClick={() => setStep(2)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-ink px-5 text-sm font-medium text-paper disabled:opacity-40"
                  >
                    Continuer <ArrowRight className="size-4" />
                  </button>
                </div>
                {!file && <p className="mt-2 text-right text-xs text-smoke">Joignez un fichier pour continuer.</p>}
              </div>
            )}

            {/* ---------------- ÉTAPE 2 — Demander ---------------- */}
            {step === 2 && (
              <div>
                <h1 className="font-display text-2xl tracking-tight">Étape 2 — Demander à Claude</h1>
                <p className="mt-2 text-sm text-smoke">Cliquez une demande rapide, ou écrivez la vôtre.</p>

                {file && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowPreview((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink transition-colors hover:border-ink"
                      title="Cliquer pour afficher un aperçu"
                    >
                      <Paperclip className="size-3.5" /> {file.name}
                      <span className="inline-flex items-center gap-1 text-smoke">
                        <Eye className="size-3.5" /> {showPreview ? "Masquer" : "Aperçu"}
                      </span>
                    </button>

                    {showPreview && fileUrl && (
                      <div className="mt-2 overflow-hidden rounded-[4px] border border-line bg-paper-2/40">
                        {file.type.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fileUrl} alt={file.name} className="mx-auto max-h-[420px] w-auto" />
                        ) : file.type === "application/pdf" || file.type.startsWith("text/") ? (
                          <iframe src={fileUrl} title={file.name} className="h-[420px] w-full" />
                        ) : (
                          <p className="p-4 text-center text-xs text-smoke">
                            Aperçu non disponible pour ce format.{" "}
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
                              Ouvrir le fichier
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Demandes rapides */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={sending}
                      onClick={() => ask(q)}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Conversation */}
                <div ref={scrollRef} className="mt-4 max-h-[40vh] overflow-y-auto rounded-[4px] border border-line bg-white p-4">
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-smoke">La réponse de Claude apparaîtra ici.</p>
                  ) : (
                    <ul className="flex flex-col gap-4">
                      {messages.map((m, i) => (
                        <li key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                          <div
                            className={`inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-[4px] px-3.5 py-2.5 text-sm leading-relaxed ${
                              m.role === "user" ? "bg-ink text-paper" : "border border-line bg-paper-2/50 text-ink"
                            }`}
                          >
                            {m.content}
                          </div>
                        </li>
                      ))}
                      {sending && (
                        <li className="text-left">
                          <div className="inline-flex items-center gap-2 rounded-[4px] border border-line bg-paper-2/50 px-3.5 py-2.5 text-sm text-smoke">
                            <Loader2 className="size-4 animate-spin" /> Claude réfléchit…
                          </div>
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Saisie libre */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(input);
                  }}
                  className="mt-3 flex items-end gap-2"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        ask(input);
                      }
                    }}
                    rows={1}
                    placeholder="Écrire une demande…"
                    className="max-h-32 min-h-11 flex-1 resize-none rounded-[2px] border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:border-ink"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-[2px] bg-ink px-4 text-paper disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between">
                  <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
                    <ArrowLeft className="size-4" /> Retour
                  </button>
                  <button
                    type="button"
                    disabled={!lastReply}
                    onClick={() => setStep(3)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-ink px-5 text-sm font-medium text-paper disabled:opacity-40"
                  >
                    Continuer <ArrowRight className="size-4" />
                  </button>
                </div>
                {!lastReply && <p className="mt-2 text-right text-xs text-smoke">Obtenez une réponse de Claude pour continuer.</p>}
              </div>
            )}

            {/* ---------------- ÉTAPE 3 — Déposer ---------------- */}
            {step === 3 && (
              <div>
                <h1 className="font-display text-2xl tracking-tight">Étape 3 — Déposer chez le client</h1>
                <p className="mt-2 text-sm text-smoke">Choisissez le client et le dossier. Rien n'est déposé sans votre confirmation.</p>

                {/* Récap de ce qui sera déposé — cliquable pour aperçu */}
                <div className="mt-5 rounded-[4px] border border-line bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-smoke">Ce qui sera déposé — cliquez pour aperçu</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {/* Fichier original */}
                    <button type="button" onClick={() => setShowOrig((v) => !v)} className="flex items-center gap-2 text-left text-sm text-ink hover:text-smoke">
                      <FileText className="size-4 text-smoke" /> {file?.name}
                      <span className="ml-1 inline-flex items-center gap-1 text-xs text-smoke"><Eye className="size-3.5" /> {showOrig ? "Masquer" : "Aperçu"}</span>
                    </button>
                    {showOrig && fileUrl && (
                      <div className="overflow-hidden rounded-[4px] border border-line bg-paper-2/40">
                        {file?.type.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fileUrl} alt={file?.name} className="mx-auto max-h-[380px] w-auto" />
                        ) : file?.type === "application/pdf" || file?.type.startsWith("text/") ? (
                          <iframe src={fileUrl} title={file?.name} className="h-[380px] w-full" />
                        ) : (
                          <p className="p-4 text-center text-xs text-smoke">
                            Aperçu non disponible.{" "}
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">Ouvrir</a>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Résumé (le PDF est mis en page à partir de ce texte) */}
                    {lastReply && (
                      <>
                        <button type="button" onClick={toggleSummaryPreview} className="flex items-center gap-2 text-left text-sm text-ink hover:text-smoke">
                          <FileText className="size-4 text-smoke" /> Résumé - {file?.name.replace(/\.[^.]+$/, "")}.pdf
                          <span className="ml-1 inline-flex items-center gap-1 text-xs text-smoke"><Eye className="size-3.5" /> {showSummary ? "Masquer" : "Aperçu"}</span>
                        </button>
                        {showSummary && (
                          <div className="overflow-hidden rounded-[4px] border border-line bg-paper-2/40">
                            {summaryPdfLoading ? (
                              <div className="flex h-[380px] items-center justify-center text-smoke">
                                <Loader2 className="size-5 animate-spin" />
                              </div>
                            ) : summaryPdfUrl ? (
                              <iframe src={summaryPdfUrl} title="Aperçu du résumé PDF" className="h-[420px] w-full" />
                            ) : (
                              <p className="p-4 text-center text-xs text-smoke">Aperçu indisponible.</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-smoke">Client</label>
                    <select className={inputCls} value={depSub} onChange={(e) => { setDepSub(e.target.value); setDepFolder(""); setConfirming(false); }}>
                      <option value="">Choisir un client…</option>
                      {subaccounts.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-smoke">Dossier</label>
                    <select className={inputCls} value={depFolder} onChange={(e) => setDepFolder(e.target.value)} disabled={!depSub}>
                      <option value="">Racine (aucun dossier)</option>
                      {folders.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {depSub && (
                  <div className="mt-3 flex items-center gap-2">
                    <input className={`${inputCls} max-w-[16rem]`} placeholder="Nouveau dossier (ex. Baux)" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} />
                    <button type="button" onClick={createFolder} disabled={!newFolder.trim()} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[2px] border border-line px-3 text-sm text-ink hover:bg-paper-2 disabled:opacity-50">
                      <FolderPlus className="size-4" /> Créer
                    </button>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => { setStep(2); setConfirming(false); }} className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
                    <ArrowLeft className="size-4" /> Retour
                  </button>

                  {!confirming ? (
                    <button
                      type="button"
                      disabled={!depSub}
                      onClick={() => setConfirming(true)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-ink px-5 text-sm font-medium text-paper disabled:opacity-40"
                    >
                      <Upload className="size-4" /> Déposer
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setConfirming(false)} className="inline-flex h-11 items-center rounded-[2px] border border-line px-4 text-sm text-ink hover:bg-paper-2">
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={doDeposit}
                        disabled={depositing}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-green-700 px-5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {depositing ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Confirmer le dépôt chez {depSub}
                      </button>
                    </div>
                  )}
                </div>
                {!depSub && <p className="mt-2 text-right text-xs text-smoke">Choisissez un client pour déposer.</p>}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
