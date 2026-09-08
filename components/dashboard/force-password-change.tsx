"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ *
 * Écran bloquant affiché au 1er login après qu'un admin a défini un mot de
 * passe temporaire. Le client DOIT choisir son propre mot de passe avant
 * d'accéder au tableau de bord.
 * ------------------------------------------------------------------ */
export function ForcePasswordChange({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit: (newPassword: string) => Promise<void>;
}) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (pw.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (pw !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    setError(null);
    try {
      await onSubmit(pw);
      // Succès : `mustChangePassword` repasse à false → le tableau de bord s'affiche.
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code.includes("weak-password")) setError("Mot de passe trop faible. Essayez-en un plus long.");
      else if (code.includes("requires-recent-login"))
        setError("Session expirée. Reconnectez-vous puis réessayez.");
      else setError("Impossible d'enregistrer le mot de passe. Réessayez.");
      setBusy(false);
    }
  }

  const inputCls =
    "h-12 w-full rounded-[2px] border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm">
        <Logo className="text-ink" />
        <div className="mt-10 flex size-11 items-center justify-center rounded-full bg-ink/5">
          <KeyRound className="size-5 text-ink" />
        </div>
        <h1 className="mt-5 font-display text-3xl tracking-tight">Choisissez votre mot de passe</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-smoke">
          Vous êtes connecté avec un mot de passe temporaire pour <strong className="text-ink">{email}</strong>.
          Pour votre sécurité, définissez votre propre mot de passe afin de continuer.
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="new-pw" className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">
              Nouveau mot de passe
            </label>
            <input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="8 caractères minimum"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="confirm-pw" className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">
              Confirmer
            </label>
            <input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Retapez le mot de passe"
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
              "Enregistrer et continuer"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
