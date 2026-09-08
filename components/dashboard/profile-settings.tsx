"use client";

import { useState } from "react";
import { KeyRound, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ *
 * Panneau « Paramètres » du tableau de bord. Permet à tout client qui se
 * connecte avec un mot de passe de le changer QUAND IL VEUT (pas seulement
 * au 1er login). Les comptes Google / lien courriel n'ont pas de mot de
 * passe à gérer ici.
 * ------------------------------------------------------------------ */
export function ProfileSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, hasPasswordProvider, updateOwnPassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setDone(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (next.length < 8) return setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (next !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    setError(null);
    try {
      await updateOwnPassword(current, next);
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("wrong-password") || code.includes("invalid-credential"))
        setError("Mot de passe actuel incorrect.");
      else if (code.includes("weak-password")) setError("Nouveau mot de passe trop faible.");
      else if (code.includes("too-many-requests")) setError("Trop de tentatives. Réessayez plus tard.");
      else setError("Impossible de changer le mot de passe. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "h-11 w-full rounded-[2px] border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-noir/60 backdrop-blur-sm" onClick={close} aria-hidden />
      <div className="relative w-full max-w-md overflow-hidden rounded-[4px] border border-line bg-paper shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl tracking-tight">Paramètres du compte</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="inline-flex size-8 items-center justify-center rounded-[3px] text-smoke hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-smoke">Compte</p>
            <p className="mt-1 text-sm text-ink">{user?.email ?? "—"}</p>
          </div>

          {hasPasswordProvider ? (
            <div>
              <div className="mb-4 flex items-center gap-2 text-ink">
                <KeyRound className="size-4" />
                <p className="text-sm font-medium">Changer le mot de passe</p>
              </div>

              {done && (
                <p className="mb-4 rounded-[2px] border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
                  Mot de passe mis à jour ✓
                </p>
              )}

              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="cur-pw" className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">
                    Mot de passe actuel
                  </label>
                  <input
                    id="cur-pw"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="new-pw2" className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="new-pw2"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    placeholder="8 caractères minimum"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="conf-pw2" className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">
                    Confirmer
                  </label>
                  <input
                    id="conf-pw2"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {error && (
                  <p className="rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}

                <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Enregistrement…
                    </>
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <p className="rounded-[2px] border border-line bg-paper-2/60 p-4 text-sm leading-relaxed text-smoke">
              Vous vous connectez avec Google ou par lien courriel — il n'y a pas de mot de passe à gérer ici.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
