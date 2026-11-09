"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Eye,
  Loader2,
  Mail,
  MailWarning,
  Phone,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

/* ------------------------------------------------------------------ *
 * Demandes de contact reçues par le formulaire du site.
 * Bulle « nouvelle » tant que la demande n'a pas été ouverte ; statut de
 * suivi (contactée, devenue cliente, sans suite) ; alerte si le délai de
 * réponse promis (48 h) est dépassé.
 * ------------------------------------------------------------------ */

type Status = "nouvelle" | "contactee" | "client" | "sans_suite";

type Req = {
  id: string;
  nom: string;
  courriel: string;
  tel: string;
  parc: string;
  service: string;
  message: string;
  createdAt: string;
  status: Status;
  seenAt: string | null;
  seenBy: string | null;
  followUp: string;
  emailOk: boolean;
};

type Tab = Status | "all";

const STATUS: { key: Status; label: string; tab: string }[] = [
  { key: "nouvelle", label: "À traiter", tab: "À traiter" },
  { key: "contactee", label: "Contactée", tab: "Contactées" },
  { key: "client", label: "Devenue cliente", tab: "Devenues clientes" },
  { key: "sans_suite", label: "Sans suite", tab: "Sans suite" },
];
const LABEL = Object.fromEntries(STATUS.map((s) => [s.key, s.label])) as Record<Status, string>;

/** Délai de réponse promis dans l'accusé de réception envoyé au prospect. */
const PROMISED_HOURS = 48;

const inputCls =
  "h-10 w-full rounded-[2px] border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtRelative(iso: string): string {
  const h = hoursSince(iso);
  if (Number.isNaN(h)) return "";
  if (h < 1 / 60) return "à l'instant";
  if (h < 1) return `il y a ${Math.round(h * 60)} min`;
  if (h < 24) return `il y a ${Math.round(h)} h`;
  const days = Math.round(h / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return new Date(iso).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

/** Dernières données connues (mémoire de session seulement) → affichage instantané au retour. */
let requestsCache: Req[] | null = null;

function ContactRequests() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, isAdmin } = useAuth();

  const [requests, setRequests] = useState<Req[]>(requestsCache ?? []);
  const [dataLoading, setDataLoading] = useState(!requestsCache);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(params.get("id") ? "all" : "nouvelle");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(params.get("id"));
  const [followDrafts, setFollowDrafts] = useState<Record<string, string>>({});

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

  const update = useCallback((fn: (rs: Req[]) => Req[]) => {
    setRequests((rs) => {
      const next = fn(rs);
      requestsCache = next;
      return next;
    });
  }, []);

  const markSeen = useCallback(
    (id: string) => {
      update((rs) => rs.map((r) => (r.id === id && !r.seenAt ? { ...r, seenAt: new Date().toISOString(), seenBy: user?.email ?? null } : r)));
      authedFetch("/api/admin/contact-requests", { method: "PATCH", body: JSON.stringify({ id, seen: true }) }).catch(() => {});
    },
    [authedFetch, update, user]
  );

  const deepLinkId = useRef(params.get("id"));
  const refresh = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/contact-requests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chargement impossible.");
      const list: Req[] = Array.isArray(data.requests) ? data.requests : [];
      setRequests(list);
      requestsCache = list;
      // Lien direct depuis le courriel (?id=) : la demande est ouverte → vue.
      const linked = deepLinkId.current && list.find((r) => r.id === deepLinkId.current);
      deepLinkId.current = null;
      if (linked && !linked.seenAt) markSeen(linked.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setDataLoading(false);
    }
  }, [authedFetch, markSeen]);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [loading, user, isAdmin, refresh]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { nouvelle: 0, contactee: 0, client: 0, sans_suite: 0, all: requests.length };
    for (const r of requests) c[r.status]++;
    return c;
  }, [requests]);
  const unseen = requests.filter((r) => !r.seenAt).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (!q) return true;
      return [r.nom, r.courriel, r.tel, r.message, r.service, r.parc].some((v) => v.toLowerCase().includes(q));
    });
  }, [requests, tab, query]);

  function toggle(r: Req) {
    if (openId === r.id) {
      setOpenId(null);
      return;
    }
    setOpenId(r.id);
    if (!r.seenAt) markSeen(r.id);
  }

  async function save(key: string, body: Record<string, unknown>, optimistic: (rs: Req[]) => Req[]) {
    setBusy(key);
    setError(null);
    update(optimistic);
    try {
      const res = await authedFetch("/api/admin/contact-requests", { method: "PATCH", body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(r: Req) {
    if (!window.confirm(`Supprimer définitivement la demande de ${r.nom} ?`)) return;
    setBusy(`del-${r.id}`);
    update((rs) => rs.filter((x) => x.id !== r.id));
    try {
      const res = await authedFetch("/api/admin/contact-requests", { method: "DELETE", body: JSON.stringify({ id: r.id }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Suppression impossible.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
      refresh();
    } finally {
      setBusy(null);
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
      <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
          <ArrowLeft className="size-4" /> Zone admin
        </Link>
        <span className="kicker text-smoke">Demandes de contact</span>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <h1 className="flex flex-wrap items-center gap-3 font-display text-3xl tracking-tight">
          <UserPlus className="size-6" /> Demandes de contact
          {unseen > 0 && (
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 font-sans text-sm font-medium text-white">
              {unseen} nouvelle{unseen > 1 ? "s" : ""}
            </span>
          )}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Chaque demande envoyée par le formulaire du site arrive ici (en plus du courriel). Une
          demande reste « à traiter » tant que son statut n'est pas changé.
        </p>

        {error && (
          <p className="mt-5 flex items-start justify-between gap-3 rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Fermer"><X className="size-4" /></button>
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {[...STATUS.map((s) => ({ key: s.key as Tab, label: s.tab })), { key: "all" as Tab, label: "Toutes" }].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
                  active ? "border-ink bg-ink text-paper" : "border-line bg-white text-smoke hover:border-ink hover:text-ink"
                }`}
              >
                {t.label}
                <span className={`tabular text-xs ${active ? "text-paper/70" : "text-smoke/70"}`}>{counts[t.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-smoke" />
          <input className={`${inputCls} pl-10`} placeholder="Rechercher un nom, un courriel, un téléphone…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-12 text-smoke"><Loader2 className="size-5 animate-spin" /></div>
        ) : visible.length === 0 ? (
          <p className="mt-5 rounded-[3px] border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-smoke">
            {tab === "nouvelle" ? "Aucune demande à traiter." : "Aucune demande ici."}
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-2.5">
            {visible.map((r) => {
              const open = openId === r.id;
              const overdue = r.status === "nouvelle" && hoursSince(r.createdAt) > PROMISED_HOURS;
              const draft = followDrafts[r.id] ?? r.followUp;
              return (
                <li key={r.id} className={`rounded-[3px] border bg-white ${!r.seenAt ? "border-ink" : "border-line"}`}>
                  <button type="button" onClick={() => toggle(r)} className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        {!r.seenAt && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-white">
                            Nouvelle
                          </span>
                        )}
                        <span className={`font-medium ${!r.seenAt ? "text-ink" : "text-ink/85"}`}>{r.nom}</span>
                        {r.status !== "nouvelle" && (
                          <span className="rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-smoke">{LABEL[r.status]}</span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-smoke">
                        {[r.service, r.parc].filter(Boolean).join(" · ") || r.courriel}
                      </p>
                      {!open && r.message && <p className="mt-1 line-clamp-1 text-sm text-ink/70">{r.message}</p>}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.65rem] text-amber-800">
                            <AlertTriangle className="size-3" /> Délai de {PROMISED_HOURS} h dépassé
                          </span>
                        )}
                        {!r.emailOk && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[0.65rem] text-red-700">
                            <MailWarning className="size-3" /> Courriel non envoyé
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-[0.7rem] text-smoke">
                      {fmtRelative(r.createdAt)}
                      <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-line-soft px-4 pb-4 pt-3">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`mailto:${r.courriel}?subject=${encodeURIComponent("Votre demande — LM Gestion Immobilière")}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper"
                        >
                          <Mail className="size-4" /> {r.courriel}
                        </a>
                        {r.tel && (
                          <a href={`tel:${r.tel.replace(/[^\d+]/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-[2px] border border-line px-3.5 text-sm text-ink hover:bg-paper-2">
                            <Phone className="size-4" /> {r.tel}
                          </a>
                        )}
                      </div>

                      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                        <div><dt className="text-[0.65rem] uppercase tracking-wide text-smoke">Reçue le</dt><dd>{fmtDate(r.createdAt)}</dd></div>
                        <div><dt className="text-[0.65rem] uppercase tracking-wide text-smoke">Service recherché</dt><dd>{r.service || "—"}</dd></div>
                        <div><dt className="text-[0.65rem] uppercase tracking-wide text-smoke">Taille du parc</dt><dd>{r.parc || "—"}</dd></div>
                        <div><dt className="text-[0.65rem] uppercase tracking-wide text-smoke">Vue</dt><dd className="inline-flex items-center gap-1"><Eye className="size-3.5 text-smoke" /> {r.seenAt ? `${fmtDate(r.seenAt)}${r.seenBy ? ` · ${r.seenBy.split("@")[0]}` : ""}` : "—"}</dd></div>
                      </dl>

                      <p className="mt-4 text-[0.65rem] uppercase tracking-wide text-smoke">Message</p>
                      <p className="mt-1 whitespace-pre-wrap break-words rounded-[2px] border border-line bg-paper-2/40 px-3 py-2.5 text-sm leading-relaxed">{r.message || "—"}</p>

                      <p className="mt-4 text-[0.65rem] uppercase tracking-wide text-smoke">Statut du suivi</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {STATUS.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            disabled={busy === `status-${r.id}`}
                            onClick={() => save(`status-${r.id}`, { id: r.id, status: s.key }, (rs) => rs.map((x) => (x.id === r.id ? { ...x, status: s.key } : x)))}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              r.status === s.key ? "border-ink bg-ink text-paper" : "border-line bg-white text-smoke hover:border-ink hover:text-ink"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      <p className="mt-4 text-[0.65rem] uppercase tracking-wide text-smoke">Notes de suivi (internes)</p>
                      <textarea
                        rows={2}
                        value={draft}
                        onChange={(e) => setFollowDrafts((m) => ({ ...m, [r.id]: e.target.value }))}
                        placeholder="Ex. : rappelé le 10 nov., visite prévue mardi…"
                        className="mt-1.5 w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={draft === r.followUp || busy === `follow-${r.id}`}
                          onClick={() => save(`follow-${r.id}`, { id: r.id, followUp: draft }, (rs) => rs.map((x) => (x.id === r.id ? { ...x, followUp: draft } : x)))}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[2px] border border-line px-3 text-xs text-ink hover:bg-paper-2 disabled:opacity-40"
                        >
                          {busy === `follow-${r.id}` && <Loader2 className="size-3.5 animate-spin" />} Enregistrer la note
                        </button>
                        <button type="button" onClick={() => remove(r)} disabled={busy === `del-${r.id}`} className="inline-flex items-center gap-1 text-xs text-smoke hover:text-red-600 disabled:opacity-50">
                          <Trash2 className="size-3.5" /> Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

export default function ContactRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <ContactRequests />
    </Suspense>
  );
}
