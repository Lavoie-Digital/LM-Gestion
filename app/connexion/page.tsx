"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { easeLux } from "@/lib/motion";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";

const PERKS = [
  "Revenus et occupation en temps réel",
  "Analyse IA des logements vacants",
  "Comparables du marché en continu",
];

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Demo only — no real authentication. Head straight to the dashboard.
    setTimeout(() => router.push("/tableau-de-bord"), 900);
  }

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

            <form onSubmit={submit} className="mt-9 flex flex-col gap-5">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="h-12 w-full rounded-[2px] border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-smoke">
                    Mot de passe
                  </label>
                  <span className="text-xs text-smoke/70">Oublié ?</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-smoke" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 w-full rounded-[2px] border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-line" />
              <span className="mono text-[0.6rem] uppercase tracking-[0.2em] text-smoke">ou</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={() => router.push("/tableau-de-bord")}
              className="mt-6 w-full rounded-[2px] border border-line py-3.5 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
            >
              Continuer en mode démonstration
            </button>

            <p className="mt-6 text-center text-xs leading-relaxed text-smoke">
              Démo · aucune authentification réelle. Utilisez n'importe quels identifiants ou
              poursuivez en mode démonstration.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
