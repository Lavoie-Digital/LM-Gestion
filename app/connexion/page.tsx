"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { easeLux } from "@/lib/motion";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const PERKS = [
  "Revenus et occupation en temps réel",
  "Analyse IA des logements vacants",
  "Comparables du marché en continu",
];

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Courriel ou mot de passe incorrect.";
  if (code.includes("popup-closed") || code.includes("cancelled-popup")) return "Connexion annulée.";
  if (code.includes("too-many-requests")) return "Trop de tentatives. Réessayez plus tard.";
  if (code.includes("unauthorized-domain")) return "Domaine non autorisé dans Firebase.";
  return "La connexion a échoué. Réessayez.";
}

export default function ConnexionPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    configured,
    isAllowed,
    signInWithGoogle,
    signInWithEmail,
    sendLoginLink,
    completeEmailLinkSignIn,
    signOut,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePassword, setUsePassword] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  // Ouverture d'un lien magique reçu par courriel → termine la connexion.
  useEffect(() => {
    completeEmailLinkSignIn().catch((err) => setError(authErrorMessage(err)));
  }, [completeEmailLinkSignIn]);

  // Connecté + autorisé → vers le tableau de bord.
  useEffect(() => {
    if (!authLoading && user && isAllowed) router.replace("/tableau-de-bord");
  }, [authLoading, user, isAllowed, router]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendLoginLink(email);
      setLinkSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // Connecté mais non autorisé (hors liste blanche).
  const deniedAccess = !authLoading && user && !isAllowed;

  return (
    <main className="grid min-h-[100svh] lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-noir p-12 text-paper lg:flex">
        <div className="grid-faint absolute inset-0 opacity-40" aria-hidden />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeLux }}
          className="relative"
        >
          <Link href="/" className="text-paper">
            <Logo />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: easeLux, delay: 0.15 }}
          className="relative max-w-md"
        >
          <span className="kicker text-ash">Espace client</span>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,4vw,3.75rem)] font-light leading-[1.02] tracking-tight">
            Le pilotage de votre <span className="italic">patrimoine</span>.
          </h1>
          <p className="mt-6 text-pretty leading-relaxed text-ash">
            Tout votre parc immobilier réuni dans une interface unique, claire et augmentée
            par l'intelligence artificielle.
          </p>

          <ul className="mt-9 flex flex-col gap-3.5">
            {PERKS.map((perk, i) => (
              <motion.li
                key={perk}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: easeLux, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-paper/85"
              >
                <span aria-hidden className="size-1.5 rotate-45 bg-paper/60" />
                {perk}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <div className="relative flex items-center gap-2 text-ash">
          <span className="live-dot inline-block size-2 rounded-full bg-paper/70" />
          <span className="mono text-[0.6rem] uppercase tracking-[0.22em]">
            Données synchronisées en continu
          </span>
        </div>
      </aside>

      {/* Form panel */}
      <section className="relative flex flex-col bg-paper">
        <div className="flex items-center justify-between p-6 lg:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-smoke transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Retour au site
          </Link>
          <span className="lg:hidden">
            <Logo subtitle={false} className="text-ink" />
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeLux, delay: 0.1 }}
            className="w-full max-w-sm"
          >
            <h2 className="font-display text-4xl tracking-tight">Connexion</h2>
            <p className="mt-3 text-[0.95rem] text-smoke">
              Accédez au tableau de bord de votre portefeuille.
            </p>

            {!configured ? (
              <div className="mt-9 rounded-[2px] border border-line bg-paper-2/60 p-5 text-sm leading-relaxed text-smoke">
                L'authentification n'est pas encore configurée. Ajoutez les clés Firebase
                (<code className="text-ink">NEXT_PUBLIC_FIREBASE_*</code>) au fichier <code className="text-ink">.env</code>.
              </div>
            ) : deniedAccess ? (
              <div className="mt-9 flex flex-col gap-4">
                <div className="rounded-[2px] border border-line bg-paper-2/60 p-5 text-sm leading-relaxed text-smoke">
                  Connecté en tant que <strong className="text-ink">{user?.email}</strong>, mais ce
                  compte n'a pas accès au tableau de bord.
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-sm text-ink underline-offset-4 hover:underline"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={google}
                  disabled={busy}
                  className="mt-9 flex h-12 w-full items-center justify-center gap-3 rounded-[2px] border border-line bg-white text-sm font-medium text-ink transition-colors hover:bg-paper-2 disabled:opacity-50"
                >
                  <GoogleG className="size-4" />
                  Continuer avec Google
                </button>

                <div className="my-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-line" />
                  <span className="mono text-[0.6rem] uppercase tracking-[0.2em] text-smoke">ou</span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                {linkSent ? (
                  <div className="rounded-[2px] border border-line bg-paper-2/60 p-5 text-sm leading-relaxed text-smoke">
                    <p className="font-medium text-ink">Lien envoyé ✓</p>
                    <p className="mt-1">
                      Ouvrez le courriel envoyé à <strong className="text-ink">{email}</strong> et
                      cliquez sur le lien pour vous connecter. (Pensez à vérifier vos indésirables.)
                    </p>
                    <button
                      type="button"
                      onClick={() => setLinkSent(false)}
                      className="mt-3 text-ink underline-offset-4 hover:underline"
                    >
                      Utiliser un autre courriel
                    </button>
                  </div>
                ) : (
                  <form onSubmit={usePassword ? submitEmail : sendLink} className="flex flex-col gap-5">
                    <div>
                      <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">
                        Courriel
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-smoke" />
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vous@exemple.com"
                          className="h-12 w-full rounded-[2px] border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink"
                        />
                      </div>
                    </div>

                    {usePassword && (
                      <div>
                        <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">
                          Mot de passe
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-smoke" />
                          <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 w-full rounded-[2px] border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink"
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </p>
                    )}

                    <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
                      {busy ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {usePassword ? "Connexion…" : "Envoi du lien…"}
                        </>
                      ) : usePassword ? (
                        "Se connecter"
                      ) : (
                        "Recevoir un lien de connexion"
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setUsePassword((v) => !v);
                        setError(null);
                      }}
                      className="text-center text-xs text-smoke underline-offset-4 hover:text-ink hover:underline"
                    >
                      {usePassword ? "← Recevoir plutôt un lien par courriel" : "J'ai déjà un mot de passe"}
                    </button>
                  </form>
                )}

                <p className="mt-6 text-center text-xs leading-relaxed text-smoke">
                  Accès réservé aux clients. Sans mot de passe : connectez-vous avec Google ou
                  recevez un lien — aucun compte à créer.
                </p>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
