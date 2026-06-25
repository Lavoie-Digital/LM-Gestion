"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { easeLux } from "@/lib/motion";
import { Button } from "@/components/ui/button";

const inputCls =
  "h-12 w-full rounded-[2px] border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";
const labelCls = "mb-2 block text-xs font-medium uppercase tracking-wider text-smoke";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 1000);
  }

  return (
    <div className="rounded-[4px] border border-line bg-paper-2/40 p-6 md:p-8">
      <AnimatePresence mode="wait">
        {status === "sent" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeLux }}
            className="flex min-h-[22rem] flex-col items-center justify-center text-center"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-ink text-paper">
              <Check className="size-6" />
            </span>
            <h3 className="mt-6 font-display text-2xl tracking-tight">Message reçu</h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-smoke">
              Merci. Un membre de notre équipe vous recontactera sous peu. (Démo — aucun
              courriel n'est réellement envoyé.)
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm text-ink underline-offset-4 hover:underline"
            >
              Envoyer un autre message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="nom" className={labelCls}>
                  Nom
                </label>
                <input id="nom" name="nom" required placeholder="Votre nom" className={inputCls} />
              </div>
              <div>
                <label htmlFor="tel" className={labelCls}>
                  Téléphone
                </label>
                <input id="tel" name="tel" type="tel" placeholder="(418) 000-0000" className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="courriel" className={labelCls}>
                Courriel
              </label>
              <input
                id="courriel"
                name="courriel"
                type="email"
                required
                placeholder="vous@exemple.com"
                className={inputCls}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="parc" className={labelCls}>
                  Taille de votre parc
                </label>
                <select id="parc" name="parc" className={inputCls} defaultValue="">
                  <option value="" disabled>
                    Sélectionnez…
                  </option>
                  <option>1 à 10 logements</option>
                  <option>11 à 50 logements</option>
                  <option>51 à 150 logements</option>
                  <option>Plus de 150 logements</option>
                </select>
              </div>
              <div>
                <label htmlFor="service" className={labelCls}>
                  Service recherché
                </label>
                <select id="service" name="service" className={inputCls} defaultValue="">
                  <option value="" disabled>
                    Sélectionnez…
                  </option>
                  <option>Service clé en main</option>
                  <option>Optimisation des revenus · IA</option>
                  <option>Entretien & travaux</option>
                  <option>Service de location</option>
                  <option>Consultation et accompagnement</option>
                  <option>Autre / à déterminer</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className={labelCls}>
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Parlez-nous de votre portefeuille…"
                className="w-full rounded-[2px] border border-line bg-white p-4 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink"
              />
            </div>

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={status === "sending"}>
              {status === "sending" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                "Envoyer le message"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
