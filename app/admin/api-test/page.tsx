"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";

const inputCls =
  "h-11 w-full rounded-[2px] border border-line bg-white px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

// URL de base CONFIRMÉE : api.plexflow.ca (API .NET/Azure ; la racine redirige
// vers /app). app.plexflow.ca et api.plexflow.io n'existent pas (NXDOMAIN).
// Les chemins d'endpoints restent à confirmer via la doc/support PlexFlow.
const BASE_CANDIDATES = [
  "https://api.plexflow.ca",
  "https://api.plexflow.ca/v1",
  "https://api.plexflow.ca/api/v1",
  "https://api.plexflow.ca/rest",
];
const PATH_CANDIDATES = [
  "",
  "units",
  "properties",
  "buildings",
  "leases",
  "tenants",
  "payments",
  "me",
  "account",
  "webhooks",
];

type Result = {
  requestedUrl?: string;
  status?: number;
  ok?: boolean;
  contentType?: string | null;
  body?: string;
  error?: string;
};

export default function ApiTestPage() {
  const router = useRouter();
  const { user, loading, isAdmin, configured } = useAuth();

  const [baseUrl, setBaseUrl] = useState(BASE_CANDIDATES[0]);
  const [path, setPath] = useState("");
  const [authStyle, setAuthStyle] = useState<"bearer" | "x-api-key">("bearer");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!loading && (!configured || !user || !isAdmin)) router.replace("/connexion");
  }, [loading, user, isAdmin, configured, router]);

  async function test() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/plexflow/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, path, authStyle }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Erreur." });
    } finally {
      setBusy(false);
    }
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
        <span className="kicker text-smoke">Test API PlexFlow</span>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl tracking-tight">Découverte de l'API PlexFlow</h1>
        <p className="mt-2 text-sm text-smoke">
          Comme PlexFlow ne documente pas l'URL de base, on la trouve en sondant. Essaie les
          candidats ci-dessous ; un statut <strong>200</strong> avec du JSON = bonne URL. Ta clé API
          n'est envoyée qu'aux domaines <code>*.plexflow.ca</code>.
        </p>

        <div className="mt-8 flex flex-col gap-4 rounded-[3px] border border-line bg-paper-2/40 p-5">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">URL de base</label>
            <input className={inputCls} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              {BASE_CANDIDATES.map((c) => (
                <button key={c} type="button" onClick={() => setBaseUrl(c)} className="rounded-full border border-line px-3 py-1 text-xs text-smoke hover:border-ink hover:text-ink">
                  {c.replace("https://", "")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-smoke">Endpoint (chemin)</label>
            <input className={inputCls} value={path} onChange={(e) => setPath(e.target.value)} placeholder="ex. units" />
            <div className="mt-2 flex flex-wrap gap-2">
              {PATH_CANDIDATES.map((c) => (
                <button key={c || "root"} type="button" onClick={() => setPath(c)} className="rounded-full border border-line px-3 py-1 text-xs text-smoke hover:border-ink hover:text-ink">
                  /{c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-smoke">Auth</span>
            <label className="flex items-center gap-2">
              <input type="radio" checked={authStyle === "bearer"} onChange={() => setAuthStyle("bearer")} />
              Authorization: Bearer
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={authStyle === "x-api-key"} onChange={() => setAuthStyle("x-api-key")} />
              X-API-Key
            </label>
          </div>

          <button
            type="button"
            onClick={test}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-[2px] bg-ink px-5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Tester
          </button>
        </div>

        {result && (
          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
              {typeof result.status === "number" && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    result.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                  }`}
                >
                  HTTP {result.status}
                </span>
              )}
              {result.contentType && <span className="text-xs text-smoke">{result.contentType}</span>}
              {result.requestedUrl && <span className="text-xs text-smoke">{result.requestedUrl}</span>}
            </div>
            {result.error && (
              <p className="rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{result.error}</p>
            )}
            {result.body && (
              <pre className="max-h-[28rem] overflow-auto rounded-[2px] border border-line bg-white p-4 text-xs leading-relaxed text-ink">
                {result.body}
              </pre>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
