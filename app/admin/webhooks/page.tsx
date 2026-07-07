"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Send, Trash2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Entry = {
  at: string;
  method: "POST" | "SIMULATION";
  eventType?: string;
  verified: boolean | null;
  matchedSigHeader?: string;
  headers: Record<string, string>;
  body: unknown;
};

const WEBHOOK_URL = "https://lmgestionimmobiliere.ca/api/webhooks/plexflow";

// Faux événement de test (structure inventée — sert juste à vérifier le récepteur).
const SAMPLE = {
  event: "payment.received",
  eventType: "Paiement reçu",
  propertyId: "TEST-PROP-001",
  unitId: "TEST-UNIT-101",
  currentRentTotalCents: 120000,
  note: "Ceci est un test envoyé depuis /admin/webhooks",
};

export default function WebhooksPage() {
  const router = useRouter();
  const { user, loading, isAdmin, configured } = useAuth();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!loading && (!configured || !user || !isAdmin)) router.replace("/connexion");
  }, [loading, user, isAdmin, configured, router]);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/plexflow/webhook-log", { cache: "no-store" });
      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (loading || !isAdmin) return;
    refresh();
  }, [loading, isAdmin, refresh]);

  useEffect(() => {
    if (!autoRefresh || loading || !isAdmin) return;
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [autoRefresh, loading, isAdmin, refresh]);

  async function sendTest() {
    setSending(true);
    try {
      await fetch("/api/webhooks/plexflow", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-simulation": "1" },
        body: JSON.stringify(SAMPLE),
      });
      await refresh();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  async function clearLog() {
    await fetch("/api/plexflow/webhook-log", { method: "DELETE" });
    await refresh();
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
        <span className="kicker text-smoke">Webhooks PlexFlow</span>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl tracking-tight">Inspecteur de webhooks</h1>
        <p className="mt-2 text-sm text-smoke">
          Vérifie le récepteur et observe les événements réels de PlexFlow. Dès qu'un vrai
          événement arrive, tu verras ici le <strong>header de signature</strong> et la
          <strong> structure du payload</strong> — ce que PlexFlow ne documente pas.
        </p>

        {/* URL à enregistrer dans PlexFlow */}
        <div className="mt-6 rounded-[3px] border border-line bg-paper-2/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-smoke">
            URL à coller dans PlexFlow (Webhook URL)
          </p>
          <code className="mt-1.5 block break-all text-sm text-ink">{WEBHOOK_URL}</code>
          <p className="mt-2 text-xs text-smoke/80">
            Pas besoin de l'URL de base de PlexFlow : les webhooks vont de PlexFlow vers nous.
            (En local, remplace le domaine par ton URL de dev.)
          </p>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={sendTest}
            disabled={sending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-ink px-5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Envoyer un test
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] border border-line px-4 text-sm text-ink hover:bg-paper-2 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /> Rafraîchir
          </button>
          <label className="flex items-center gap-2 text-sm text-smoke">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto (4 s)
          </label>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={clearLog}
              className="ml-auto inline-flex items-center gap-2 text-sm text-smoke hover:text-red-600"
            >
              <Trash2 className="size-4" /> Vider
            </button>
          )}
        </div>

        {/* Liste des événements */}
        <div className="mt-6 flex flex-col gap-3">
          {entries.length === 0 && (
            <p className="rounded-[2px] border border-line bg-white px-4 py-6 text-center text-sm text-smoke">
              Aucun événement reçu. Clique « Envoyer un test », ou attends un vrai événement PlexFlow.
              <br />
              <span className="text-xs text-smoke/70">
                (Journal en mémoire : se vide au redéploiement.)
              </span>
            </p>
          )}
          {entries.map((e, i) => (
            <details key={i} className="rounded-[3px] border border-line bg-white">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2.5 px-4 py-3 text-sm">
                {e.verified === true ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : e.verified === false ? (
                  <XCircle className="size-4 text-amber-500" />
                ) : (
                  <span className="size-2 rounded-full bg-smoke/40" />
                )}
                <span className="font-medium">{e.eventType || "type inconnu"}</span>
                {e.method === "SIMULATION" && (
                  <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-smoke">
                    test
                  </span>
                )}
                <span className="ml-auto text-xs text-smoke">{new Date(e.at).toLocaleString("fr-CA")}</span>
              </summary>
              <div className="border-t border-line px-4 py-3 text-xs">
                <p className="text-smoke">
                  Signature :{" "}
                  {e.verified === null
                    ? "aucun secret configuré"
                    : e.verified
                      ? `vérifiée (header ${e.matchedSigHeader})`
                      : "non vérifiée avec les schémas connus"}
                </p>
                <p className="mt-3 font-medium text-ink">Headers</p>
                <pre className="mt-1 max-h-52 overflow-auto rounded-[2px] bg-paper-2/50 p-3 leading-relaxed">
                  {JSON.stringify(e.headers, null, 2)}
                </pre>
                <p className="mt-3 font-medium text-ink">Payload</p>
                <pre className="mt-1 max-h-72 overflow-auto rounded-[2px] bg-paper-2/50 p-3 leading-relaxed">
                  {JSON.stringify(e.body, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
