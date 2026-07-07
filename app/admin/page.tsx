"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Building2, Loader2, LogOut, Plus, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { firebaseConfigured } from "@/lib/firebase";
import {
  addBuilding,
  addOwner,
  assignBuilding,
  deleteBuilding,
  deleteOwner,
  listBuildings,
  listOwners,
  type Building,
  type Owner,
} from "@/lib/portfolio";

const inputCls =
  "h-11 w-full rounded-[2px] border border-line bg-white px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-smoke/60 focus:border-ink";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAdmin, configured, signOut } = useAuth();

  const [owners, setOwners] = useState<Owner[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [buildingCity, setBuildingCity] = useState("");

  // Garde d'accès : réservé aux admins.
  useEffect(() => {
    if (!loading && (!configured || !user || !isAdmin)) router.replace("/connexion");
  }, [loading, user, isAdmin, configured, router]);

  const refresh = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [o, b] = await Promise.all([listOwners(), listBuildings()]);
      setOwners(o);
      setBuildings(b);
    } catch {
      setError("Lecture Firestore impossible. Activez Firestore et vérifiez les règles d'accès.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin && configured) refresh();
  }, [loading, user, isAdmin, configured, refresh]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch {
      setError("Opération impossible (vérifiez Firestore et les règles d'accès).");
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

  const ownerName_ = (id?: string | null) => owners.find((o) => o.id === id)?.name ?? "—";

  return (
    <main className="min-h-[100svh] bg-paper text-ink">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/tableau-de-bord" className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
            <ArrowLeft className="size-4" /> Tableau de bord
          </Link>
          <span className="kicker text-smoke">Zone admin</span>
          <Link href="/admin/api-test" className="text-sm text-smoke underline-offset-2 hover:text-ink hover:underline">
            Test API PlexFlow
          </Link>
          <Link href="/admin/webhooks" className="text-sm text-smoke underline-offset-2 hover:text-ink hover:underline">
            Webhooks
          </Link>
        </div>
        <button type="button" onClick={() => signOut()} className="inline-flex items-center gap-2 text-sm text-smoke hover:text-ink">
          <LogOut className="size-4" /> Déconnexion
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl tracking-tight">Gestion des accès clients</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Créez les profils clients (propriétaires) et assignez chaque immeuble à son
          propriétaire. Chaque client ne verra que les immeubles qui lui sont assignés.
        </p>

        {!configured && (
          <p className="mt-6 rounded-[2px] border border-line bg-paper-2/60 p-4 text-sm text-smoke">
            Firebase/Firestore non configuré. Ajoutez les clés <code>NEXT_PUBLIC_FIREBASE_*</code> et
            activez Firestore dans la console.
          </p>
        )}
        {error && (
          <p className="mt-6 rounded-[2px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {/* Profils clients */}
          <section>
            <h2 className="flex items-center gap-2 font-display text-xl tracking-tight">
              <UserPlus className="size-5" /> Profils clients
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ownerName.trim() || !ownerEmail.trim()) return;
                run(async () => {
                  await addOwner({ name: ownerName, email: ownerEmail });
                  setOwnerName("");
                  setOwnerEmail("");
                });
              }}
              className="mt-5 flex flex-col gap-3 rounded-[3px] border border-line bg-paper-2/40 p-4 sm:flex-row"
            >
              <input className={inputCls} placeholder="Nom du client" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              <input className={inputCls} type="email" placeholder="Courriel" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
              <button type="submit" disabled={busy} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[2px] bg-ink px-4 text-sm font-medium text-paper disabled:opacity-50">
                <Plus className="size-4" /> Ajouter
              </button>
            </form>

            <ul className="mt-4 flex flex-col gap-2">
              {owners.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-[2px] border border-line px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium">{o.name}</span>
                    <span className="ml-2 text-smoke">{o.email}</span>
                  </span>
                  <button type="button" onClick={() => run(() => deleteOwner(o.id))} className="text-smoke hover:text-red-600" aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
              {!dataLoading && owners.length === 0 && <li className="text-sm text-smoke">Aucun profil pour l'instant.</li>}
            </ul>
          </section>

          {/* Immeubles */}
          <section>
            <h2 className="flex items-center gap-2 font-display text-xl tracking-tight">
              <Building2 className="size-5" /> Immeubles
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!buildingName.trim()) return;
                run(async () => {
                  await addBuilding({ name: buildingName, city: buildingCity });
                  setBuildingName("");
                  setBuildingCity("");
                });
              }}
              className="mt-5 flex flex-col gap-3 rounded-[3px] border border-line bg-paper-2/40 p-4 sm:flex-row"
            >
              <input className={inputCls} placeholder="Nom / adresse" value={buildingName} onChange={(e) => setBuildingName(e.target.value)} />
              <input className={inputCls} placeholder="Ville" value={buildingCity} onChange={(e) => setBuildingCity(e.target.value)} />
              <button type="submit" disabled={busy} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[2px] bg-ink px-4 text-sm font-medium text-paper disabled:opacity-50">
                <Plus className="size-4" /> Ajouter
              </button>
            </form>

            <ul className="mt-4 flex flex-col gap-2">
              {buildings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-[2px] border border-line px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{b.name}</span>
                    <span className="text-smoke">{b.city || "—"} · {ownerName_(b.ownerId)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <select
                      className="h-9 rounded-[2px] border border-line bg-white px-2 text-xs text-ink outline-none focus:border-ink"
                      value={b.ownerId ?? ""}
                      onChange={(e) => run(() => assignBuilding(b.id, e.target.value || null))}
                      disabled={busy}
                    >
                      <option value="">Non assigné</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => run(() => deleteBuilding(b.id))} className="text-smoke hover:text-red-600" aria-label="Supprimer">
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </li>
              ))}
              {!dataLoading && buildings.length === 0 && <li className="text-sm text-smoke">Aucun immeuble. (Ils seront ingérés depuis PlexFlow une fois l'API branchée.)</li>}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
