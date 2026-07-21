"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Download, FileText, Folder, FolderPlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { easeLux } from "@/lib/motion";

type Doc = {
  id: string;
  name: string;
  folder: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  url?: string;
};

function fmtSize(b: number) {
  if (!b) return "";
  const kb = b / 1024;
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
}

export function DocumentExplorer({
  subaccount,
  getToken,
  onClose,
}: {
  subaccount: string;
  getToken: () => Promise<string>;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [cwd, setCwd] = useState(""); // "" = racine
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const authed = useCallback(
    async (url: string, init?: RequestInit) => {
      const t = await getToken();
      return fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${t}` } });
    },
    [getToken]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authed(`/api/admin/documents?subaccount=${encodeURIComponent(subaccount)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setDocs(Array.isArray(data.documents) ? data.documents : []);
      setFolders(Array.isArray(data.folders) ? data.folders : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [authed, subaccount]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("subaccount", subaccount);
        if (cwd) fd.append("folder", cwd);
        const res = await authed("/api/admin/documents", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error || "Téléversement échoué.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléversement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function createFolder() {
    const name = folderName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await authed("/api/admin/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subaccount, name }),
      });
      setFolderName("");
      setCreatingFolder(false);
      await load();
      setCwd(name);
    } catch {
      setError("Création du dossier impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function removeFolder(name: string) {
    if (!window.confirm(`Supprimer le dossier « ${name} » ? Les documents qu'il contient retourneront à la racine.`)) return;
    setBusy(true);
    try {
      await authed("/api/admin/folders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subaccount, name }),
      });
      if (cwd === name) setCwd("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(id: string) {
    if (!window.confirm("Supprimer ce document ?")) return;
    setBusy(true);
    try {
      await authed("/api/admin/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const currentDocs = docs.filter((d) => (d.folder || "") === cwd);
  const showFolders = cwd === "";

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
          className="flex h-full w-full max-w-3xl flex-col bg-paper shadow-2xl"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.4, ease: easeLux }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <p className="kicker text-smoke">Documents</p>
              <h2 className="truncate font-display text-xl tracking-tight text-ink">{subaccount}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Fermer" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[3px] text-smoke hover:bg-paper-2 hover:text-ink">
              <X className="size-5" />
            </button>
          </header>

          {/* Barre d'outils : fil d'Ariane + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-3">
            <nav className="flex items-center gap-1 text-sm">
              <button type="button" onClick={() => setCwd("")} className={cwd === "" ? "font-medium text-ink" : "text-smoke hover:text-ink"}>
                Documents
              </button>
              {cwd && (
                <>
                  <ChevronRight className="size-4 text-smoke" />
                  <span className="font-medium text-ink">{cwd}</span>
                </>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreatingFolder((v) => !v)}
                disabled={cwd !== ""}
                title={cwd !== "" ? "Créez les dossiers depuis la racine" : "Nouveau dossier"}
                className="inline-flex h-9 items-center gap-1.5 rounded-[2px] border border-line px-3 text-sm text-ink hover:bg-paper-2 disabled:opacity-40"
              >
                <FolderPlus className="size-4" /> Nouveau dossier
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Téléverser
              </button>
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  uploadFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {creatingFolder && cwd === "" && (
            <div className="flex items-center gap-2 border-b border-line bg-paper-2/40 px-6 py-3">
              <input
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
                placeholder="Nom du dossier (ex. Baux)"
                className="h-9 w-56 rounded-[2px] border border-line bg-white px-3 text-sm text-ink outline-none focus:border-ink"
              />
              <button type="button" onClick={createFolder} disabled={!folderName.trim() || busy} className="inline-flex h-9 items-center rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50">
                Créer
              </button>
              <button type="button" onClick={() => { setCreatingFolder(false); setFolderName(""); }} className="text-sm text-smoke hover:text-ink">
                Annuler
              </button>
            </div>
          )}

          {error && <p className="mx-6 mt-3 rounded-[2px] border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

          {/* Corps : zone de dépôt + contenu */}
          <div
            className={`relative flex-1 overflow-y-auto px-6 py-5 ${dragOver ? "bg-paper-2/60" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              uploadFiles(Array.from(e.dataTransfer.files ?? []));
            }}
          >
            {dragOver && (
              <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-[6px] border-2 border-dashed border-ink bg-paper/80">
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Upload className="size-5" /> Déposez pour téléverser dans « {cwd || "Racine"} »
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex h-40 items-center justify-center text-smoke">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : (
              <>
                {/* Bouton retour dans un dossier */}
                {cwd && (
                  <button type="button" onClick={() => setCwd("")} className="mb-3 inline-flex items-center gap-1.5 text-sm text-smoke hover:text-ink">
                    <ChevronRight className="size-4 rotate-180" /> Retour aux dossiers
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {/* Dossiers (à la racine) */}
                  {showFolders &&
                    folders.map((f) => {
                      const count = docs.filter((d) => (d.folder || "") === f).length;
                      return (
                        <div key={f} className="group relative">
                          <button
                            type="button"
                            onClick={() => setCwd(f)}
                            className="flex w-full flex-col items-start gap-2 rounded-[4px] border border-line bg-white p-4 text-left transition-colors hover:border-ink"
                          >
                            <Folder className="size-7 text-ink/70" strokeWidth={1.5} />
                            <span className="w-full truncate text-sm font-medium text-ink">{f}</span>
                            <span className="text-xs text-smoke">{count} fichier{count > 1 ? "s" : ""}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFolder(f)}
                            className="absolute right-2 top-2 hidden rounded-[2px] p-1 text-smoke hover:text-red-600 group-hover:block"
                            aria-label="Supprimer le dossier"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}

                  {/* Fichiers du dossier courant */}
                  {currentDocs.map((d) => (
                    <div key={d.id} className="group relative">
                      <a
                        href={d.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-full w-full flex-col items-start gap-2 rounded-[4px] border border-line bg-white p-4 transition-colors hover:border-ink"
                      >
                        <FileText className="size-7 text-smoke" strokeWidth={1.5} />
                        <span className="w-full break-words text-sm font-medium leading-snug text-ink">{d.name}</span>
                        <span className="text-xs text-smoke">
                          {fmtDate(d.uploadedAt)}
                          {fmtSize(d.size) ? ` · ${fmtSize(d.size)}` : ""}
                        </span>
                      </a>
                      <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                        {d.url && (
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="rounded-[2px] bg-paper/90 p-1 text-smoke hover:text-ink" aria-label="Télécharger">
                            <Download className="size-4" />
                          </a>
                        )}
                        <button type="button" onClick={() => removeDoc(d.id)} className="rounded-[2px] bg-paper/90 p-1 text-smoke hover:text-red-600" aria-label="Supprimer">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vide */}
                {((showFolders && folders.length === 0) || !showFolders) && currentDocs.length === 0 && (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-[4px] border-2 border-dashed border-line py-12 text-center">
                    <Upload className="size-7 text-smoke" />
                    <p className="mt-2 text-sm text-smoke">Glissez-déposez des fichiers ici</p>
                    <p className="text-xs text-smoke/70">ou utilisez le bouton « Téléverser »</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
