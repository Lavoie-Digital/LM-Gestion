"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, LogOut, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatCAD } from "@/lib/utils";

type Row = {
  name: string;
  unitCount: number;
  monthlyRevenueCents: number;
  email: string | null;
  ownerId: string | null;
};

const inputCls =
  "h-10 w-full rounded-[2px] border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // sous-compte en cours
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/connexion");
  }, [loading, user, isAdmin, router]);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await user!.getIdToken();
      return fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
      });
    },
    [user]
  );

  const refresh = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/admin/subaccounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setRows(Array.isArray(data.subaccounts) ? data.subaccounts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setDataLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    if (!loading && user && isAdmin) refresh();
  }, [loading, user, isAdmin, refresh]);

  async function link(name: string) {
    const email = (emails[name] ?? "").trim();
    if (!email) return;
    setBusy(name);
    setError(null);
    try {
      const res = await authedFetch("/api/admin/owners", {
        method: "POST",
        body: JSON.stringify({ subaccount: name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Association impossible.");
      setEmails((m) => ({ ...m, [name]: "" }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Association impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function unlink(name: string) {
    setBusy(name);
    setError(null);
    try {
      const res = await authedFetch("/api/admin/owners", {
        method: "DELETE",
        body: JSON.stringify({ subaccount: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retrait impossible.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Retrait impossible.");
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  const linkedCount = rows.filter((r) => r.email).length;

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-[100svh] bg-paper text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/tableau-de-bord" className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
            <ArrowLeft className="size-4" /> Tableau de bord
          </Link>
          <span className="kicker text-smoke">Zone admin</span>
          <Link href="/admin/api-test" className="text-sm text-smoke underline-offset-2 hover:text-ink hover:underline">
            Test API
          </Link>
          <Link href="/admin/webhooks" className="text-sm text-smoke underline-offset-2 hover:text-ink hover:underline">
            Webhooks
          </Link>
        </div>
        <button type="button" onClick={() => signOut()} className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
          <LogOut className="size-4" /> Déconnexion
        </button>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl tracking-tight">Accès clients</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Les sous-comptes proviennent directement de PlexFlow. Associez un courriel à un
          sous-compte : le propriétaire pourra alors se connecter et ne verra <strong>que</strong> son
          parc. L'accès est accordé automatiquement — aucune liste à tenir à la main.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-smoke">
          <span><span className="font-medium text-ink tabular">{rows.length}</span> sous-comptes</span>
          <span><span className="font-medium text-ink tabular">{linkedCount}</span> associés</span>
          <span><span className="font-medium text-ink tabular">{rows.length - linkedCount}</span> sans accès</span>
        </div>

        {/* Recherche */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-smoke" />
          <input
            className={`${inputCls} h-11 pl-10`}
            placeholder="Rechercher un sous-compte ou un courriel…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && (
          <p className="mt-4 rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {dataLoading ? (
          <div className="mt-10 flex justify-center text-smoke">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-2.5">
            {filtered.map((r) => {
              const working = busy === r.name;
              return (
                <li key={r.name} className="rounded-[3px] border border-line bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium text-ink">
                        {r.email && <Check className="size-4 text-green-600" />}
                        <span className="truncate">{r.name}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-smoke">
                        {r.unitCount > 0
                          ? `${r.unitCount} logement${r.unitCount > 1 ? "s" : ""} · ${formatCAD(Math.round(r.monthlyRevenueCents / 100))}/mois`
                          : "Aucun logement dans le parc actuel"}
                      </p>
                    </div>

                    {r.email ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-800">{r.email}</span>
                        <button
                          type="button"
                          onClick={() => unlink(r.name)}
                          disabled={working}
                          className="inline-flex items-center gap-1 text-xs text-smoke hover:text-red-600 disabled:opacity-50"
                        >
                          {working ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Retirer
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          link(r.name);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="email"
                          required
                          placeholder="courriel@client.com"
                          value={emails[r.name] ?? ""}
                          onChange={(e) => setEmails((m) => ({ ...m, [r.name]: e.target.value }))}
                          className={`${inputCls} w-56`}
                        />
                        <button
                          type="submit"
                          disabled={working}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
                        >
                          {working ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Associer
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="rounded-[2px] border border-line bg-white px-4 py-8 text-center text-sm text-smoke">
                {rows.length === 0
                  ? "Aucun sous-compte reçu de PlexFlow (vérifiez la configuration PlexFlow)."
                  : "Aucun résultat pour cette recherche."}
              </li>
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
