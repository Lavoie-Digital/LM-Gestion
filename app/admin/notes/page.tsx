"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  Inbox,
  Loader2,
  Lock,
  Mail,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { FilePicker, type NoteAttachment } from "@/components/dashboard/notes";

/* ------------------------------------------------------------------ *
 * Boîte de réception des notes — tous les fils de tous les clients.
 * Un fil reste « à traiter » tant qu'on ne l'a pas marqué réglé (le lire ne
 * le fait plus disparaître). Assignation à un employé, notes internes,
 * suivi des courriels / lectures du client, relance.
 * ------------------------------------------------------------------ */

type ThreadStatus = "open" | "waiting" | "resolved";

type Msg = {
  id: string;
  title: string;
  body: string;
  from: "manager" | "client";
  author?: string;
  status: "sent" | "scheduled";
  scheduledFor?: string | null;
  attachments?: NoteAttachment[];
  createdAt: string;
  internal?: boolean;
  read?: boolean;
  seenByClientAt?: string | null;
  emailedTo?: string[];
  emailedAt?: string | null;
  emailAttemptedAt?: string | null;
  remindedAt?: string | null;
};

type Thread = {
  id: string;
  subaccount: string;
  title: string;
  status: ThreadStatus;
  assignedTo: string | null;
  internal: boolean;
  lastActivityAt: string;
  lastFrom: "manager" | "client";
  unread: number;
  messages: Msg[];
};

type Tab = "open" | "mine" | "waiting" | "resolved" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "open", label: "À traiter" },
  { key: "mine", label: "Mes notes" },
  { key: "waiting", label: "En attente du client" },
  { key: "resolved", label: "Réglées" },
  { key: "all", label: "Toutes" },
];

const STATUS_LABEL: Record<ThreadStatus, string> = {
  open: "À traiter",
  waiting: "En attente du client",
  resolved: "Réglée",
};

const inputCls =
  "h-10 w-full rounded-[2px] border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";
const areaCls =
  "w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

const short = (email?: string | null) => (email ? email.split("@")[0] : "");

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-CA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** « il y a 5 min », « hier », « 3 nov. »… */
function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return "";
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.round(h / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

/** Jours écoulés depuis une date ISO. */
const daysSince = (iso?: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / 86_400_000 : 0);

function StatusChip({ status }: { status: ThreadStatus }) {
  const cls =
    status === "open"
      ? "border-ink bg-ink text-paper"
      : status === "waiting"
        ? "border-line-strong bg-white text-ink"
        : "border-line bg-paper-2 text-smoke";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide ${cls}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function Attachments({ items }: { items?: NoteAttachment[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((a, i) =>
        a.url ? (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-[0.7rem] text-ink hover:border-ink">
            <Paperclip className="size-3 shrink-0" /> <span className="truncate">{a.name}</span>
          </a>
        ) : (
          <span key={i} className="inline-flex items-center gap-1 text-[0.7rem] text-smoke">
            <Paperclip className="size-3" /> {a.name}
          </span>
        )
      )}
    </div>
  );
}

/** Ligne de suivi sous une note du gestionnaire : courriel envoyé, vu par le client. */
function Tracking({ m }: { m: Msg }) {
  if (m.from !== "manager" || m.internal) return null;
  if (m.status === "scheduled") {
    return (
      <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-ink/40 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-ink">
        <Clock className="size-3" /> Programmée · {fmtDate(m.scheduledFor)}
      </p>
    );
  }
  const emailed = m.emailedTo ?? [];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-smoke">
      {emailed.length > 0 ? (
        <span className="inline-flex items-center gap-1" title={emailed.join(", ")}>
          <Mail className="size-3" />
          Courriel envoyé à {emailed.length > 1 ? `${emailed.length} adresses` : emailed[0]}
        </span>
      ) : m.emailAttemptedAt ? (
        <span className="inline-flex items-center gap-1 text-amber-800">
          <Mail className="size-3" /> Aucun courriel envoyé — aucun accès client actif
        </span>
      ) : null}
      {m.remindedAt && (
        <span className="inline-flex items-center gap-1">
          <BellRing className="size-3" /> Relancé · {fmtDate(m.remindedAt)}
        </span>
      )}
      {m.emailedTo === undefined && !m.emailAttemptedAt && !m.seenByClientAt ? null : m.seenByClientAt ? (
        <span className="inline-flex items-center gap-1 text-green-700">
          <Eye className="size-3" /> Vue par le client · {fmtDate(m.seenByClientAt)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <EyeOff className="size-3" /> Pas encore vue par le client
        </span>
      )}
    </div>
  );
}

function Message({ m, onDelete, deleting }: { m: Msg; onDelete: () => void; deleting: boolean }) {
  const label = m.internal
    ? `Note interne · ${short(m.author)}`
    : m.from === "client"
      ? `Client${m.author ? ` · ${m.author}` : ""}`
      : `Gestionnaire${m.author ? ` · ${short(m.author)}` : ""}`;
  const cls = m.internal
    ? "border-dashed border-amber-300 bg-amber-50/70"
    : m.from === "client"
      ? "border-ink/40 bg-white"
      : m.status === "scheduled"
        ? "border-dashed border-ink/40 bg-paper-2/30"
        : "border-line bg-paper-2/40";
  return (
    <div className={`rounded-[3px] border p-3.5 text-sm ${cls}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-smoke/80">
          {m.internal && <Lock className="size-3" />}
          {label}
          {m.from === "client" && !m.read && <span className="ml-1 inline-block size-1.5 rounded-full bg-ink" aria-label="Non lue" />}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[0.7rem] text-smoke/70">{fmtDate(m.createdAt)}</span>
          <button type="button" onClick={onDelete} disabled={deleting} className="text-smoke hover:text-red-600 disabled:opacity-50" aria-label="Supprimer cette note">
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        </div>
      </div>
      {m.title && <p className="mt-1 font-medium text-ink">{m.title}</p>}
      {m.body && <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-ink/80">{m.body}</p>}
      <Attachments items={m.attachments} />
      <Tracking m={m} />
    </div>
  );
}

/**
 * Dernières données connues, gardées en mémoire (jamais sur disque) le temps
 * de la session : revenir sur la boîte de réception l'affiche instantanément,
 * puis elle se met à jour en arrière-plan.
 */
let inboxCache: { threads: Thread[]; team: string[]; me: string } | null = null;

function NotesInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, isAdmin } = useAuth();

  const [threads, setThreads] = useState<Thread[]>(inboxCache?.threads ?? []);
  const [team, setTeam] = useState<string[]>(inboxCache?.team ?? []);
  const [me, setMe] = useState(inboxCache?.me ?? "");
  const [clients, setClients] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(!inboxCache);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Lien direct vers un fil ou un client → onglet « Toutes » pour ne rien masquer.
  const [tab, setTab] = useState<Tab>(params.get("thread") || params.get("client") ? "all" : "open");
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState(params.get("client") ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("thread"));
  const [composing, setComposing] = useState(false);

  // Réponse dans le fil sélectionné
  const [reply, setReply] = useState("");
  const [replyInternal, setReplyInternal] = useState(false);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [resolveAfter, setResolveAfter] = useState(false);

  // Nouvelle note
  const emptyDraft = { subaccount: "", title: "", body: "", internal: false, assignedTo: "", scheduledFor: "" };
  const [draft, setDraft] = useState(emptyDraft);
  const [draftFiles, setDraftFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/connexion");
  }, [loading, user, isAdmin, router]);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await user!.getIdToken();
      const isForm = init?.body instanceof FormData;
      return fetch(url, {
        ...init,
        headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
      });
    },
    [user]
  );

  const deepLinkId = useRef(params.get("thread"));
  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await authedFetch("/api/admin/inbox");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chargement impossible.");
      const list: Thread[] = Array.isArray(data.threads) ? data.threads : [];
      setThreads(list);
      const linked = deepLinkId.current && list.find((t) => t.id === deepLinkId.current);
      deepLinkId.current = null;
      if (linked && linked.unread > 0) {
        authedFetch("/api/admin/notes", { method: "PATCH", body: JSON.stringify({ threadId: linked.id, action: "read" }) }).catch(() => {});
        setThreads((ts) => ts.map((t) => (t.id === linked.id ? { ...t, unread: 0 } : t)));
      }
      const nextTeam: string[] = Array.isArray(data.team) ? data.team : [];
      const nextMe = typeof data.me === "string" ? data.me : "";
      setTeam(nextTeam);
      setMe(nextMe);
      inboxCache = { threads: list, team: nextTeam, me: nextMe };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setDataLoading(false);
      setSyncing(false);
    }
  }, [authedFetch]);

  /** Applique un changement local immédiat (et le garde en mémoire). */
  const updateThreads = useCallback((fn: (ts: Thread[]) => Thread[]) => {
    setThreads((ts) => {
      const next = fn(ts);
      if (inboxCache) inboxCache = { ...inboxCache, threads: next };
      return next;
    });
  }, []);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    refresh();
    const id = setInterval(refresh, 60_000); // rafraîchissement automatique
    return () => clearInterval(id);
  }, [loading, user, isAdmin, refresh]);

  // Liste des clients (pour « Nouvelle note ») — chargée à la première ouverture.
  useEffect(() => {
    if (!composing || clients.length || !user) return;
    authedFetch("/api/admin/subaccounts")
      .then((r) => r.json())
      .then((d) => setClients(Array.isArray(d.subaccounts) ? d.subaccounts.map((s: { name: string }) => s.name) : []))
      .catch(() => {});
  }, [composing, clients.length, user, authedFetch]);

  const counts = useMemo(
    () => ({
      open: threads.filter((t) => t.status === "open").length,
      mine: threads.filter((t) => t.assignedTo === me && t.status !== "resolved").length,
      waiting: threads.filter((t) => t.status === "waiting").length,
      resolved: threads.filter((t) => t.status === "resolved").length,
      all: threads.length,
    }),
    [threads, me]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      if (tab === "open" && t.status !== "open") return false;
      if (tab === "mine" && !(t.assignedTo === me && t.status !== "resolved")) return false;
      if (tab === "waiting" && t.status !== "waiting") return false;
      if (tab === "resolved" && t.status !== "resolved") return false;
      if (clientFilter && t.subaccount !== clientFilter) return false;
      if (!q) return true;
      return (
        t.subaccount.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.messages.some((m) => m.body.toLowerCase().includes(q) || (m.author ?? "").toLowerCase().includes(q))
      );
    });
  }, [threads, tab, me, query, clientFilter]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  // Ouvrir un fil le marque LU (sans changer son statut).
  const markRead = useCallback(
    (threadId: string) => {
      updateThreads((ts) => ts.map((t) => (t.id === threadId ? { ...t, unread: 0, messages: t.messages.map((m) => ({ ...m, read: true })) } : t)));
      authedFetch("/api/admin/notes", { method: "PATCH", body: JSON.stringify({ threadId, action: "read" }) }).catch(() => {});
    },
    [authedFetch, updateThreads]
  );

  function openThread(id: string) {
    if ((threads.find((t) => t.id === id)?.unread ?? 0) > 0) markRead(id);
    setSelectedId(id);
    setComposing(false);
    setReply("");
    setReplyFiles([]);
    setResolveAfter(false);
    setReplyInternal(false);
    router.replace(`/admin/notes?thread=${encodeURIComponent(id)}`, { scroll: false });
  }

  /**
   * Exécute une action : changement affiché tout de suite (optimistic), requête,
   * puis resynchronisation en ARRIÈRE-PLAN (on n'attend plus la relecture
   * complète). En cas d'erreur, la resynchronisation annule le changement local.
   */
  async function act(key: string, fn: () => Promise<Response>, optimistic?: (ts: Thread[]) => Thread[]) {
    setBusy(key);
    setError(null);
    if (optimistic) updateThreads(optimistic);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Opération impossible.");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opération impossible.");
      return null;
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const patch = (threadId: string, body: Record<string, unknown>, key: string) =>
    act(
      key,
      () => authedFetch("/api/admin/notes", { method: "PATCH", body: JSON.stringify({ threadId, ...body }) }),
      body.action === "status" || body.action === "assign"
        ? (ts) =>
            ts.map((t) =>
              t.id !== threadId
                ? t
                : body.action === "status"
                  ? { ...t, status: body.status as ThreadStatus }
                  : { ...t, assignedTo: (body.assignedTo as string) || null }
            )
        : undefined
    );

  async function sendReply(t: Thread) {
    if (!reply.trim() && replyFiles.length === 0) return;
    const fd = new FormData();
    fd.append("subaccount", t.subaccount);
    fd.append("parentId", t.id);
    fd.append("body", reply.trim());
    if (replyInternal || t.internal) fd.append("internal", "true");
    replyFiles.forEach((f) => fd.append("files", f));
    const data = await act("reply", () => authedFetch("/api/admin/notes", { method: "POST", body: fd }));
    if (!data?.note) return;
    const note = data.note as Msg;
    updateThreads((ts) =>
      ts.map((x) =>
        x.id !== t.id
          ? x
          : {
              ...x,
              messages: [...x.messages, note],
              status: note.internal ? x.status : "waiting",
              lastActivityAt: note.createdAt,
              lastFrom: "manager",
            }
      )
    );
    if (resolveAfter) await patch(t.id, { action: "status", status: "resolved" }, "status");
    setReply("");
    setReplyFiles([]);
    setResolveAfter(false);
  }

  async function createNote() {
    if (!draft.subaccount || (!draft.body.trim() && draftFiles.length === 0)) return;
    const fd = new FormData();
    fd.append("subaccount", draft.subaccount);
    fd.append("title", draft.title);
    fd.append("body", draft.body.trim());
    if (draft.internal) fd.append("internal", "true");
    if (draft.assignedTo) fd.append("assignedTo", draft.assignedTo);
    if (draft.scheduledFor && !draft.internal) {
      const d = new Date(draft.scheduledFor); // datetime-local (heure locale) → ISO UTC
      if (!Number.isNaN(d.getTime())) fd.append("scheduledFor", d.toISOString());
    }
    draftFiles.forEach((f) => fd.append("files", f));
    const data = await act("create", () => authedFetch("/api/admin/notes", { method: "POST", body: fd }));
    if (!data?.threadId || !data.note) return;
    const note = data.note as Msg & { subaccount: string };
    updateThreads((ts) => [
      {
        id: data.threadId,
        subaccount: note.subaccount,
        title: note.title,
        status: note.internal ? "open" : "waiting",
        assignedTo: draft.assignedTo || null,
        internal: Boolean(note.internal),
        lastActivityAt: note.createdAt,
        lastFrom: "manager",
        unread: 0,
        messages: [note],
      },
      ...ts.filter((x) => x.id !== data.threadId),
    ]);
    setDraft(emptyDraft);
    setDraftFiles([]);
    setTab("all");
    openThread(data.threadId);
  }

  async function deleteMessage(t: Thread, m: Msg) {
    const isRoot = m.id === t.id;
    if (isRoot && !window.confirm("Supprimer ce fil au complet (toutes les réponses incluses) ?")) return;
    if (!isRoot && !window.confirm("Supprimer cette note ?")) return;
    if (isRoot) setSelectedId(null);
    await act(
      `del-${m.id}`,
      () => authedFetch("/api/admin/notes", { method: "DELETE", body: JSON.stringify({ id: m.id }) }),
      (ts) => (isRoot ? ts.filter((x) => x.id !== t.id) : ts.map((x) => (x.id === t.id ? { ...x, messages: x.messages.filter((y) => y.id !== m.id) } : x)))
    );
  }

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const lastPublic = selected
    ? [...selected.messages].reverse().find((m) => m.from === "manager" && !m.internal && m.status === "sent")
    : undefined;
  const showDetail = composing || selected;

  return (
    <main className="min-h-[100svh] bg-paper text-ink">
      <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
          <ArrowLeft className="size-4" /> Zone admin
        </Link>
        <span className="kicker text-smoke">Notes</span>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl tracking-tight">
              <Inbox className="size-6" /> Boîte de réception
              {syncing && !dataLoading && <Loader2 className="size-4 animate-spin text-smoke" aria-label="Mise à jour…" />}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-smoke">
              Tous les échanges avec les clients au même endroit. Une note reste « à traiter » tant
              qu'elle n'est pas marquée comme réglée — la lire ne la fait plus disparaître.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setComposing(true);
              setSelectedId(null);
              setDraft({ ...emptyDraft, subaccount: clientFilter });
            }}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[2px] bg-ink px-5 text-sm font-medium text-paper shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" /> Nouvelle note
          </button>
        </div>

        {error && (
          <p className="mt-5 flex items-start justify-between gap-3 rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Fermer"><X className="size-4" /></button>
          </p>
        )}

        {/* Onglets */}
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {TABS.map((t) => {
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

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-smoke" />
            <input className={`${inputCls} pl-10`} placeholder="Rechercher un client, un sujet, un mot…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {clientFilter && (
            <button
              type="button"
              onClick={() => setClientFilter("")}
              className="inline-flex h-10 items-center gap-1.5 rounded-[2px] border border-ink px-3 text-sm text-ink"
            >
              Client : {clientFilter} <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Liste des fils */}
          <div className={showDetail ? "hidden lg:block" : ""}>
            {dataLoading ? (
              <div className="flex justify-center py-12 text-smoke"><Loader2 className="size-5 animate-spin" /></div>
            ) : visible.length === 0 ? (
              <p className="rounded-[3px] border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-smoke">
                {tab === "open" ? "Rien à traiter. 🎉" : "Aucune note ici."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((t) => {
                  const last = t.messages[t.messages.length - 1];
                  const active = t.id === selectedId;
                  const stale = t.status === "waiting" && lastPublicUnseen(t) && daysSince(t.lastActivityAt) >= 3;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => openThread(t.id)}
                        className={`w-full rounded-[3px] border px-4 py-3 text-left transition-colors ${
                          active ? "border-ink bg-white" : "border-line bg-white hover:border-ink/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                            {t.unread > 0 && <span className="inline-block size-2 shrink-0 rounded-full bg-ink" aria-label="Non lu" />}
                            <span className="truncate">{t.subaccount}</span>
                          </p>
                          <span className="shrink-0 text-[0.7rem] text-smoke">{fmtRelative(t.lastActivityAt)}</span>
                        </div>
                        <p className={`mt-0.5 truncate text-sm ${t.unread > 0 ? "text-ink" : "text-ink/80"}`}>
                          {t.internal && <Lock className="mr-1 inline size-3 align-[-1px]" />}
                          {t.title || last.body.split("\n")[0] || "(sans titre)"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-smoke">
                          {last.internal ? "Note interne : " : last.from === "client" ? "Client : " : "Vous : "}
                          {last.body || (last.attachments?.length ? "Fichier(s) joint(s)" : "")}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <StatusChip status={t.status} />
                          {t.assignedTo && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[0.65rem] text-smoke" title={t.assignedTo}>
                              <UserRound className="size-3" /> {t.assignedTo === me ? "Moi" : short(t.assignedTo)}
                            </span>
                          )}
                          {stale && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.65rem] text-amber-800">
                              <EyeOff className="size-3" /> Non vue depuis {Math.floor(daysSince(t.lastActivityAt))} j
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Détail : nouvelle note OU fil sélectionné */}
          <div className={showDetail ? "" : "hidden lg:block"}>
            {composing ? (
              <section className="rounded-[3px] border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl tracking-tight">Nouvelle note</h2>
                  <button type="button" onClick={() => setComposing(false)} className="text-smoke hover:text-ink" aria-label="Fermer"><X className="size-4" /></button>
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); createNote(); }}
                  className="mt-4 flex flex-col gap-3"
                >
                  <select
                    required
                    value={draft.subaccount}
                    onChange={(e) => setDraft((d) => ({ ...d, subaccount: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">{clients.length ? "Choisir un client…" : "Chargement des clients…"}</option>
                    {draft.subaccount && !clients.includes(draft.subaccount) && <option value={draft.subaccount}>{draft.subaccount}</option>}
                    {clients.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className={inputCls} placeholder="Sujet (optionnel)" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
                  <textarea
                    rows={5}
                    className={areaCls}
                    placeholder={draft.internal ? "Note pour l'équipe (le client ne la verra pas)…" : "Message au client…"}
                    value={draft.body}
                    onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={draft.internal} onChange={(e) => setDraft((d) => ({ ...d, internal: e.target.checked, scheduledFor: e.target.checked ? "" : d.scheduledFor }))} />
                    <Lock className="size-3.5" /> Note interne <span className="text-xs text-smoke">(invisible pour le client, aucun courriel au client)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-smoke"><UserRound className="size-3.5" /> Assigner à :</span>
                    <select value={draft.assignedTo} onChange={(e) => setDraft((d) => ({ ...d, assignedTo: e.target.value }))} className="h-9 rounded-[2px] border border-line bg-white px-2 text-xs text-ink outline-none focus:border-ink">
                      <option value="">Personne</option>
                      {team.map((e) => <option key={e} value={e}>{e === me ? `Moi (${e})` : e}</option>)}
                    </select>
                    {draft.assignedTo && draft.assignedTo !== me && <span className="text-xs text-smoke">recevra un courriel</span>}
                  </div>
                  {!draft.internal && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-smoke"><Clock className="size-3.5" /> Programmer l'envoi :</span>
                      <input type="datetime-local" value={draft.scheduledFor} onChange={(e) => setDraft((d) => ({ ...d, scheduledFor: e.target.value }))} className="h-9 rounded-[2px] border border-line bg-white px-2 text-xs text-ink outline-none focus:border-ink" />
                      {draft.scheduledFor && (
                        <button type="button" onClick={() => setDraft((d) => ({ ...d, scheduledFor: "" }))} className="text-xs text-smoke underline-offset-2 hover:text-ink hover:underline">annuler</button>
                      )}
                    </div>
                  )}
                  <FilePicker files={draftFiles} setFiles={setDraftFiles} />
                  <button
                    type="submit"
                    disabled={busy === "create" || !draft.subaccount || (!draft.body.trim() && draftFiles.length === 0)}
                    className="inline-flex h-10 w-fit items-center gap-1.5 rounded-[2px] bg-ink px-4 text-sm font-medium text-paper disabled:opacity-50"
                  >
                    {busy === "create" ? <Loader2 className="size-4 animate-spin" /> : draft.scheduledFor ? <Clock className="size-4" /> : draft.internal ? <Lock className="size-4" /> : <Send className="size-4" />}
                    {draft.internal ? "Créer la note interne" : draft.scheduledFor ? "Programmer" : "Envoyer au client"}
                  </button>
                </form>
              </section>
            ) : selected ? (
              <section className="rounded-[3px] border border-line bg-white p-5">
                <button type="button" onClick={() => setSelectedId(null)} className="mb-3 inline-flex items-center gap-1.5 text-xs text-smoke hover:text-ink lg:hidden">
                  <ArrowLeft className="size-3.5" /> Retour à la liste
                </button>

                {/* En-tête du fil */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-smoke">
                      <button type="button" onClick={() => setClientFilter(selected.subaccount)} className="underline-offset-2 hover:text-ink hover:underline">
                        {selected.subaccount}
                      </button>
                    </p>
                    <h2 className="mt-0.5 font-display text-xl leading-snug tracking-tight">
                      {selected.internal && <Lock className="mr-1.5 inline size-4 align-[-2px]" />}
                      {selected.title || "(sans titre)"}
                    </h2>
                    <div className="mt-2"><StatusChip status={selected.status} /></div>
                  </div>
                  {selected.status !== "resolved" ? (
                    <button
                      type="button"
                      onClick={() => patch(selected.id, { action: "status", status: "resolved" }, "status")}
                      disabled={busy === "status"}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
                    >
                      {busy === "status" ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />} Marquer comme réglée
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => patch(selected.id, { action: "status", status: "open" }, "status")}
                      disabled={busy === "status"}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[2px] border border-line px-3.5 text-sm text-ink hover:bg-paper-2 disabled:opacity-50"
                    >
                      {busy === "status" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Rouvrir
                    </button>
                  )}
                </div>

                {/* Assignation + statut + relance */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line-soft py-3 text-xs">
                  <label className="inline-flex items-center gap-1.5 text-smoke">
                    <UserRound className="size-3.5" /> Responsable :
                    <select
                      value={selected.assignedTo ?? ""}
                      onChange={(e) => patch(selected.id, { action: "assign", assignedTo: e.target.value }, "assign")}
                      disabled={busy === "assign"}
                      className="h-8 rounded-[2px] border border-line bg-white px-2 text-xs text-ink outline-none focus:border-ink"
                    >
                      <option value="">Personne</option>
                      {team.map((e) => <option key={e} value={e}>{e === me ? `Moi (${e})` : e}</option>)}
                      {selected.assignedTo && !team.includes(selected.assignedTo) && <option value={selected.assignedTo}>{selected.assignedTo}</option>}
                    </select>
                    {busy === "assign" && <Loader2 className="size-3.5 animate-spin" />}
                  </label>
                  {selected.status === "open" && (
                    <button type="button" onClick={() => patch(selected.id, { action: "status", status: "waiting" }, "status")} className="inline-flex items-center gap-1 text-smoke underline-offset-2 hover:text-ink hover:underline">
                      <Clock className="size-3.5" /> Mettre en attente du client
                    </button>
                  )}
                  {!selected.internal && lastPublic && (
                    <button
                      type="button"
                      onClick={() => patch(selected.id, { action: "remind" }, "remind")}
                      disabled={busy === "remind"}
                      className="inline-flex items-center gap-1 text-smoke underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
                      title="Renvoie au client un courriel de rappel pour la dernière note"
                    >
                      {busy === "remind" ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />} Relancer le client
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="mt-4 flex flex-col gap-2.5">
                  {selected.messages.map((m) => (
                    <Message key={m.id} m={m} onDelete={() => deleteMessage(selected, m)} deleting={busy === `del-${m.id}`} />
                  ))}
                </div>

                {/* Réponse */}
                <form onSubmit={(e) => { e.preventDefault(); sendReply(selected); }} className="mt-5 flex flex-col gap-2 border-t border-line-soft pt-4">
                  <textarea
                    rows={3}
                    className={`${areaCls} ${replyInternal || selected.internal ? "border-amber-300 bg-amber-50/40" : ""}`}
                    placeholder={replyInternal || selected.internal ? "Note interne pour l'équipe…" : "Votre réponse au client…"}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <FilePicker files={replyFiles} setFiles={setReplyFiles} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      type="submit"
                      disabled={busy === "reply" || (!reply.trim() && replyFiles.length === 0)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[2px] bg-ink px-3.5 text-sm font-medium text-paper disabled:opacity-50"
                    >
                      {busy === "reply" ? <Loader2 className="size-4 animate-spin" /> : replyInternal || selected.internal ? <Lock className="size-4" /> : <Send className="size-4" />}
                      {replyInternal || selected.internal ? "Ajouter la note interne" : "Envoyer au client"}
                    </button>
                    {!selected.internal && (
                      <label className="inline-flex items-center gap-1.5 text-xs text-ink">
                        <input type="checkbox" checked={replyInternal} onChange={(e) => setReplyInternal(e.target.checked)} />
                        <Lock className="size-3" /> Note interne
                      </label>
                    )}
                    <label className="inline-flex items-center gap-1.5 text-xs text-ink">
                      <input type="checkbox" checked={resolveAfter} onChange={(e) => setResolveAfter(e.target.checked)} />
                      <Check className="size-3" /> Marquer réglée après l'envoi
                    </label>
                  </div>
                  {selected.assignedTo && selected.assignedTo !== me && (replyInternal || selected.internal) && (
                    <p className="text-xs text-smoke">{selected.assignedTo} sera avisé(e) par courriel.</p>
                  )}
                </form>
              </section>
            ) : (
              <div className="flex h-full min-h-[16rem] items-center justify-center rounded-[3px] border border-dashed border-line bg-white/50 px-6 text-center text-sm text-smoke">
                Sélectionnez une note pour l'ouvrir.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/** La dernière note publique envoyée au client n'a pas encore été vue. */
function lastPublicUnseen(t: Thread): boolean {
  const last = [...t.messages].reverse().find((m) => m.from === "manager" && !m.internal && m.status === "sent");
  return Boolean(last && !last.seenByClientAt);
}

export default function NotesInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100svh] items-center justify-center bg-paper text-smoke">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <NotesInbox />
    </Suspense>
  );
}
