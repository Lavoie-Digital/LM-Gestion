"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FolderOpen, Inbox, KeyRound, Loader2, LogOut, Plus, Search, ShieldCheck, Sparkles, StickyNote, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatCAD } from "@/lib/utils";
import { DocumentExplorer } from "@/components/admin/document-explorer";

type Row = { name: string; unitCount: number; monthlyRevenueCents: number; emails: string[]; openNotes?: number; manager?: string | null; manual?: boolean };
type Admins = { envAdmins: string[]; dbAdmins: { id: string; email: string }[] };

const inputCls =
  "h-10 w-full rounded-[2px] border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [admins, setAdmins] = useState<Admins>({ envAdmins: [], dbAdmins: [] });
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "with" | "without">("all");
  const [newClient, setNewClient] = useState("");
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [newAdmin, setNewAdmin] = useState("");
  // Explorateur de documents (façon fichiers) ouvert pour ce sous-compte.
  const [explorerSub, setExplorerSub] = useState<string | null>(null);

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
      const [subRes, admRes] = await Promise.all([
        authedFetch("/api/admin/subaccounts"),
        authedFetch("/api/admin/admins"),
      ]);
      const subData = await subRes.json();
      const admData = await admRes.json();
      if (!subRes.ok) throw new Error(subData.error || "Erreur sous-comptes");
      setRows(Array.isArray(subData.subaccounts) ? subData.subaccounts : []);
      setAdmins({
        envAdmins: Array.isArray(admData.envAdmins) ? admData.envAdmins : [],
        dbAdmins: Array.isArray(admData.dbAdmins) ? admData.dbAdmins : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setDataLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    if (!loading && user && isAdmin) refresh();
  }, [loading, user, isAdmin, refresh]);

  async function run(key: string, action: () => Promise<Response>) {
    setBusy(key);
    setError(null);
    try {
      const res = await action();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Opération impossible.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opération impossible.");
    } finally {
      setBusy(null);
    }
  }

  const linkEmail = (name: string) => {
    const email = (emailInputs[name] ?? "").trim();
    if (!email) return;
    run(`link-${name}`, () =>
      authedFetch("/api/admin/owners", { method: "POST", body: JSON.stringify({ subaccount: name, email }) })
    ).then(() => setEmailInputs((m) => ({ ...m, [name]: "" })));
  };
  const unlinkEmail = (name: string, email: string) =>
    run(`unlink-${name}-${email}`, () =>
      authedFetch("/api/admin/owners", { method: "DELETE", body: JSON.stringify({ subaccount: name, email }) })
    );

  // Définit un mot de passe TEMPORAIRE (repli quand le lien de connexion n'arrive
  // pas). Le client devra en choisir un à sa 1re connexion (mustChangePassword).
  async function setPassword(email: string) {
    const pw = window.prompt(
      `Mot de passe temporaire pour ${email} :\n\n` +
        `Communiquez-le au client (téléphone/SMS). Il devra choisir son propre mot de passe à sa première connexion.`,
      "Lmgestion123"
    );
    if (pw === null) return;
    const password = pw.trim();
    if (password.length < 6) {
      window.alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setBusy(`pw-${email}`);
    setError(null);
    try {
      const res = await authedFetch("/api/admin/set-password", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Opération impossible.");
      window.alert(
        `Mot de passe défini pour ${email}.\n\n` +
          `Dites au client d'aller sur la page de connexion → « Autre option de connexion », ` +
          `d'entrer son courriel et ce mot de passe. Il choisira ensuite le sien.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opération impossible.");
    } finally {
      setBusy(null);
    }
  }
  const addAdmin = () => {
    const email = newAdmin.trim();
    if (!email) return;
    run("add-admin", () => authedFetch("/api/admin/admins", { method: "POST", body: JSON.stringify({ email }) })).then(
      () => setNewAdmin("")
    );
  };
  const removeAdmin = (email: string) =>
    run(`rm-admin-${email}`, () =>
      authedFetch("/api/admin/admins", { method: "DELETE", body: JSON.stringify({ email }) })
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (accessFilter === "with" && r.emails.length === 0) return false;
      if (accessFilter === "without" && r.emails.length > 0) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.emails.some((e) => e.toLowerCase().includes(q));
    });
  }, [rows, query, accessFilter]);

  const linkedCount = rows.filter((r) => r.emails.length > 0).length;
  const totalOpen = rows.reduce((s, r) => s + (r.openNotes ?? 0), 0);
  const adminEmails = useMemo(
    () => [...new Set([...admins.envAdmins, ...admins.dbAdmins.map((a) => a.email)])],
    [admins]
  );

  const assignManager = (name: string, manager: string) =>
    run(`mgr-${name}`, () =>
      authedFetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subaccount: name, manager }),
      })
    );

  const addManualClient = () => {
    const name = newClient.trim();
    if (!name) return;
    run("add-client", () =>
      authedFetch("/api/admin/manual-subaccounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    ).then(() => setNewClient(""));
  };
  const removeManualClient = (name: string) =>
    run(`rm-client-${name}`, () =>
      authedFetch("/api/admin/manual-subaccounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    );

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
          <Link href="/admin/notes" className="inline-flex items-center gap-1.5 text-sm text-smoke underline-offset-2 hover:text-ink hover:underline">
            <Inbox className="size-3.5" /> Notes
            {totalOpen > 0 && (
              <span className="rounded-full bg-ink px-1.5 py-0.5 text-[0.6rem] font-medium text-paper no-underline">{totalOpen}</span>
            )}
          </Link>
          <Link href="/admin/assistant" className="inline-flex items-center gap-1 text-sm text-smoke underline-offset-2 hover:text-ink hover:underline">
            <Sparkles className="size-3.5" /> Assistant IA
          </Link>
          <Link href="/tableau-de-bord/demo" className="text-sm text-smoke underline-offset-2 hover:text-ink hover:underline">
            Tableau démo
          </Link>
        </div>
        <button type="button" onClick={() => signOut()} className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
          <LogOut className="size-4" /> Déconnexion
        </button>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl tracking-tight">Accès clients</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Associez un ou plusieurs courriels à un sous-compte PlexFlow : chaque personne pourra se
          connecter et ne verra <strong>que</strong> ce parc. L'accès est accordé automatiquement.
        </p>

        {error && (
          <p className="mt-6 rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {/* ---- Administrateurs ---- */}
        <section className="mt-8 rounded-[3px] border border-line bg-paper-2/40 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg tracking-tight">
            <ShieldCheck className="size-5" /> Administrateurs
          </h2>
          <p className="mt-1 text-xs text-smoke">
            Les administrateurs ont accès à cette page et au tableau de bord complet.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {admins.envAdmins.map((e) => (
              <span key={e} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink">
                {e}
                <span className="text-[0.6rem] uppercase tracking-wide text-smoke/70">permanent</span>
              </span>
            ))}
            {admins.dbAdmins.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink">
                {a.email}
                <button
                  type="button"
                  onClick={() => removeAdmin(a.email)}
                  disabled={busy === `rm-admin-${a.email}`}
                  className="text-smoke hover:text-red-600 disabled:opacity-50"
                  aria-label="Retirer"
                >
                  {busy === `rm-admin-${a.email}` ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                </button>
              </span>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addAdmin();
            }}
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              placeholder="courriel@admin.com"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              className={`${inputCls} sm:max-w-xs`}
            />
            <button
              type="submit"
              disabled={busy === "add-admin"}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
            >
              {busy === "add-admin" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Ajouter un admin
            </button>
          </form>
        </section>

        {/* ---- Sous-comptes clients ---- */}
        <div className="mt-10 flex flex-wrap items-center gap-2 text-sm">
          {(
            [
              { key: "all" as const, count: rows.length, label: "sous-comptes" },
              { key: "with" as const, count: linkedCount, label: "avec accès" },
              { key: "without" as const, count: rows.length - linkedCount, label: "sans accès" },
            ]
          ).map((s) => {
            const active = accessFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setAccessFilter(active && s.key !== "all" ? "all" : s.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
                  active ? "border-ink bg-ink text-paper" : "border-line bg-white text-smoke hover:border-ink hover:text-ink"
                }`}
              >
                <span className="font-medium tabular">{s.count}</span> {s.label}
              </button>
            );
          })}

          {/* Notes à traiter → boîte de réception */}
          <Link
            href="/admin/notes"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
              totalOpen > 0 ? "border-ink bg-white text-ink hover:bg-paper-2" : "border-line bg-white text-smoke hover:border-ink hover:text-ink"
            }`}
          >
            {totalOpen > 0 && <span className="inline-block size-1.5 rounded-full bg-current" />}
            <span className="font-medium tabular">{totalOpen}</span> note{totalOpen > 1 ? "s" : ""} à traiter
          </Link>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-smoke" />
          <input
            className={`${inputCls} h-11 pl-10`}
            placeholder="Rechercher un sous-compte ou un courriel…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Ajouter un client qui n'a pas (encore) d'unité dans PlexFlow */}
        <form
          onSubmit={(e) => { e.preventDefault(); addManualClient(); }}
          className="mt-3 flex flex-wrap items-center gap-2 rounded-[3px] border border-dashed border-line bg-paper-2/30 p-3"
        >
          <span className="text-xs text-smoke">Client absent de la liste ?</span>
          <input
            className={`${inputCls} h-9 max-w-xs`}
            placeholder="Nom exact du sous-compte PlexFlow"
            value={newClient}
            onChange={(e) => setNewClient(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newClient.trim() || busy === "add-client"}
            className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
          >
            {busy === "add-client" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Ajouter le client
          </button>
        </form>

        {dataLoading ? (
          <div className="mt-10 flex justify-center text-smoke">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-2.5">
            {filtered.map((r) => (
              <li key={r.name} className="rounded-[3px] border border-line bg-white px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium text-ink">
                      {r.emails.length > 0 && <Check className="size-4 text-green-600" />}
                      <span className="truncate">{r.name}</span>
                      {r.manual && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-smoke">
                          ajouté manuellement
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-smoke">
                      {r.unitCount > 0
                        ? `${r.unitCount} logement${r.unitCount > 1 ? "s" : ""} · ${formatCAD(Math.round(r.monthlyRevenueCents / 100))}/mois`
                        : "Aucun logement dans le parc actuel"}
                    </p>
                  </div>
                  {r.manual && (
                    <button
                      type="button"
                      onClick={() => removeManualClient(r.name)}
                      disabled={busy === `rm-client-${r.name}`}
                      className="inline-flex items-center gap-1 text-xs text-smoke hover:text-red-600 disabled:opacity-50"
                    >
                      {busy === `rm-client-${r.name}` ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Retirer
                    </button>
                  )}
                </div>

                {/* Courriels associés */}
                {r.emails.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.emails.map((e) => (
                      <span key={e} className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-800">
                        {e}
                        <button
                          type="button"
                          onClick={() => setPassword(e)}
                          disabled={busy === `pw-${e}`}
                          className="text-green-700/70 hover:text-ink disabled:opacity-50"
                          title="Définir un mot de passe temporaire (repli si le lien de connexion n'arrive pas)"
                          aria-label="Définir un mot de passe"
                        >
                          {busy === `pw-${e}` ? <Loader2 className="size-3 animate-spin" /> : <KeyRound className="size-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => unlinkEmail(r.name, e)}
                          disabled={busy === `unlink-${r.name}-${e}`}
                          className="text-green-700/70 hover:text-red-600 disabled:opacity-50"
                          aria-label="Retirer"
                        >
                          {busy === `unlink-${r.name}-${e}` ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Ajout d'un courriel */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    linkEmail(r.name);
                  }}
                  className="mt-3 flex items-center gap-2"
                >
                  <input
                    type="email"
                    required
                    placeholder="Ajouter un courriel…"
                    value={emailInputs[r.name] ?? ""}
                    onChange={(e) => setEmailInputs((m) => ({ ...m, [r.name]: e.target.value }))}
                    className={`${inputCls} max-w-xs`}
                  />
                  <button
                    type="submit"
                    disabled={busy === `link-${r.name}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[2px] border border-line px-3.5 text-sm font-medium text-ink hover:bg-paper-2 disabled:opacity-50"
                  >
                    {busy === `link-${r.name}` ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Associer
                  </button>
                </form>

                {/* Gestionnaire assigné (reçoit les notifications de ce client) */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
                  <span className="text-xs text-smoke">Gestionnaire :</span>
                  <select
                    value={r.manager ?? ""}
                    onChange={(e) => assignManager(r.name, e.target.value)}
                    disabled={busy === `mgr-${r.name}`}
                    className="h-9 rounded-[2px] border border-line bg-white px-2 text-xs text-ink outline-none focus:border-ink"
                  >
                    <option value="">Par défaut (tous)</option>
                    {adminEmails.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                    {/* Conserve une valeur assignée même si l'admin a été retiré de la liste */}
                    {r.manager && !adminEmails.includes(r.manager) && <option value={r.manager}>{r.manager}</option>}
                  </select>
                  {busy === `mgr-${r.name}` && <Loader2 className="size-3.5 animate-spin text-smoke" />}
                  {r.manager && <span className="text-xs text-smoke">reçoit les notes de ce client</span>}
                </div>

                {/* Documents du sous-compte — ouvre l'explorateur */}
                <div className="mt-3 border-t border-line-soft pt-3">
                  <button
                    type="button"
                    onClick={() => setExplorerSub(r.name)}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-1.5 text-xs text-ink hover:bg-paper-2"
                  >
                    <FolderOpen className="size-4" /> Ouvrir les documents
                  </button>
                </div>

                {/* Notes du sous-compte → boîte de réception filtrée sur ce client */}
                <div className="mt-3 border-t border-line-soft pt-3">
                  <Link
                    href={`/admin/notes?client=${encodeURIComponent(r.name)}`}
                    className="inline-flex items-center gap-1.5 text-xs text-smoke hover:text-ink"
                  >
                    <StickyNote className="size-3.5" />
                    Notes
                    {(r.openNotes ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink px-1.5 py-0.5 text-[0.6rem] font-medium text-paper">
                        {r.openNotes} à traiter
                      </span>
                    )}
                  </Link>
                </div>
              </li>
            ))}
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

      {explorerSub && (
        <DocumentExplorer
          subaccount={explorerSub}
          getToken={() => user!.getIdToken()}
          onClose={() => setExplorerSub(null)}
        />
      )}
    </main>
  );
}
