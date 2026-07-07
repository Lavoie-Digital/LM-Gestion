/* ------------------------------------------------------------------ *
 * Store PlexFlow côté serveur.
 *
 * - getPortfolio() : SOURCE PRINCIPALE = API REST PlexFlow (instantané complet
 *   du parc, mis en cache 60 s). Agrège pour le tableau de bord, filtré par
 *   « scope » (admin = tout ; propriétaire = ses sous-comptes PlexFlow, par NOM
 *   — le champ `subaccount` de l'API = `AccountName` des webhooks).
 * - persistEvent() : écrit les webhooks dans Firestore (temps réel + activité).
 *   Requiert le compte de service ; sinon ignoré proprement.
 *
 * Collections Firestore : `plexflow_events`, `pf_units`, `pf_tenants`.
 * ------------------------------------------------------------------ */

import { FieldValue } from "firebase-admin/firestore";
import { adminConfigured, adminDb } from "./firebase-admin";
import { cached } from "./cache";
import { getUnits } from "./plexflow";
import {
  activityFromEvent,
  tenantProjectionFromEvent,
  unitProjectionFromEvent,
  type ActivityItem,
  type PlexflowEvent,
} from "./plexflow-events";

export type BuildingAgg = {
  propertyId: string;
  label: string;
  city?: string;
  units: number;
  wontRenew: number;
  monthlyRevenueCents: number;
};

export type Snapshot = {
  scopeKey: string;
  date: string; // YYYY-MM-DD
  monthlyRevenueCents: number;
  unitCount: number;
  buildingCount: number;
  ownerCount: number;
  wontRenewCount: number;
};

export type UnitRow = {
  unitId: string;
  propertyId: string;
  label: string;
  unitType?: string | number;
  currentRentCents: number;
  marketPriceCents?: number | null;
  address?: string;
  tenants?: string;
  tenantsEmails?: string;
  tenantsPhones?: string;
  dateAvailableForRent?: string;
  markedWontRenew: boolean;
};

export type Portfolio = {
  scope: "admin" | "owner";
  meta: { unitCount: number; buildingCount: number; ownerCount: number };
  kpis: {
    monthlyRevenueCents: number;
    unitCount: number;
    buildingCount: number;
    wontRenewCount: number;
    wontRenewRevenueCents: number;
  };
  byBuilding: BuildingAgg[];
  units: UnitRow[];
  owners: string[];
  activity: ActivityItem[];
};

function toCents(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Agrège le portefeuille pour le tableau de bord depuis l'API REST PlexFlow.
 * @param subaccounts  null = admin (tout) ; [] = aucun accès ; [noms] = un
 *                     propriétaire (ses sous-comptes PlexFlow, par nom).
 */
export async function getPortfolio(subaccounts: string[] | null): Promise<Portfolio> {
  const scope: Portfolio["scope"] = subaccounts === null ? "admin" : "owner";

  let units: Awaited<ReturnType<typeof getUnits>>["units"] = [];
  // Cache 5 min : les webhooks invalident "plexflow:" dès qu'un changement
  // survient → toujours frais tout en minimisant les appels API (donc les ops).
  const res = await cached("plexflow:units", 300_000, () => getUnits());
  units = res?.units ?? [];

  if (subaccounts !== null) {
    if (subaccounts.length === 0) {
      units = [];
    } else {
      const set = new Set(subaccounts);
      units = units.filter((u) => typeof u.subaccount === "string" && set.has(u.subaccount));
    }
  }

  let monthlyRevenueCents = 0;
  let wontRenewCount = 0;
  let wontRenewRevenueCents = 0;
  const byProp = new Map<string, BuildingAgg>();
  const owners = new Set<string>();
  const unitRows: UnitRow[] = [];

  for (const u of units) {
    const rent = toCents(u.currentRentTotalCents);
    monthlyRevenueCents += rent;
    if (typeof u.subaccount === "string" && u.subaccount) owners.add(u.subaccount);

    const wontRenew = u.markedWontRenew === true;
    if (wontRenew) {
      wontRenewCount++;
      wontRenewRevenueCents += rent;
    }

    const key = String(u.propertyId ?? "—");
    const agg =
      byProp.get(key) ??
      ({
        propertyId: key,
        label: u.propertyNickname ?? u.propertyAddress ?? `Immeuble ${key}`,
        city: u.propertyAddressDetails?.city,
        units: 0,
        wontRenew: 0,
        monthlyRevenueCents: 0,
      } satisfies BuildingAgg);
    agg.units++;
    if (wontRenew) agg.wontRenew++;
    agg.monthlyRevenueCents += rent;
    byProp.set(key, agg);

    const x = u as Record<string, unknown>;
    const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);
    unitRows.push({
      unitId: String(u.unitId),
      propertyId: key,
      label: s(u.unitNickname) ?? s(u.apptNb) ?? `#${u.unitId}`,
      unitType: u.unitType,
      currentRentCents: rent,
      marketPriceCents: typeof u.marketPrice === "number" ? u.marketPrice : null,
      address: s(u.unitAddress),
      tenants: s(x.tenantsLeaving),
      tenantsEmails: s(x.tenantsLeavingEmails),
      tenantsPhones: s(x.tenantsLeavingPhoneNb),
      dateAvailableForRent: s(u.dateAvailableForRent),
      markedWontRenew: wontRenew,
    });
  }

  return {
    scope,
    meta: { unitCount: units.length, buildingCount: byProp.size, ownerCount: owners.size },
    kpis: {
      monthlyRevenueCents,
      unitCount: units.length,
      buildingCount: byProp.size,
      wontRenewCount,
      wontRenewRevenueCents,
    },
    byBuilding: [...byProp.values()].sort((a, b) => b.monthlyRevenueCents - a.monthlyRevenueCents),
    units: unitRows,
    owners: [...owners].sort(),
    // Fil d'activité : webhooks (temps réel) complétés par des éléments dérivés
    // de l'état REST (baux à relouer) → jamais vide, toujours à jour tout seul.
    activity: mergeActivity(await getActivity(subaccounts), deriveUpcoming(unitRows, byProp)),
  };
}

/** Éléments d'activité « à venir » dérivés de l'état courant (indépendants des webhooks). */
function deriveUpcoming(units: UnitRow[], byProp: Map<string, BuildingAgg>): ActivityItem[] {
  const candidates = units.filter((u) => u.markedWontRenew);
  const pool = candidates.length ? candidates : units.filter((u) => u.dateAvailableForRent);
  return pool
    .sort((a, b) => (a.dateAvailableForRent ?? "").localeCompare(b.dateAvailableForRent ?? ""))
    .slice(0, 12)
    .map((u) => ({
      id: `upcoming-${u.unitId}`,
      eventType: "unit_vacancy_started",
      label: u.markedWontRenew ? "Bail non renouvelé" : "Logement à relouer",
      detail: [`Logement ${u.label}`, byProp.get(u.propertyId)?.label].filter(Boolean).join(" · "),
      at: u.dateAvailableForRent,
    }));
}

/** Webhooks d'abord (récents/réels), complétés par le dérivé si trop peu d'activité. */
function mergeActivity(webhook: ActivityItem[], derived: ActivityItem[]): ActivityItem[] {
  if (webhook.length >= 5) return webhook.slice(0, 25);
  return [...webhook, ...derived].slice(0, 25);
}

/** Liste de tous les sous-comptes du parc (pour le sélecteur « Voir en tant que » admin). */
export async function listSubaccounts(): Promise<string[]> {
  const res = await cached("plexflow:units", 300_000, () => getUnits());
  const set = new Set<string>();
  for (const u of res?.units ?? []) {
    if (typeof u.subaccount === "string" && u.subaccount) set.add(u.subaccount);
  }
  return [...set].sort();
}

/* ------------------------------------------------------------------ *
 * Instantanés quotidiens (historique) → alimente les courbes de tendance.
 * L'API REST ne donne que l'état courant ; on capture un point par jour et par
 * périmètre pour construire l'historique dans le temps.
 * ------------------------------------------------------------------ */

function scopeKey(subaccounts: string[] | null): string {
  return subaccounts === null ? "all" : subaccounts.slice().sort().join("|") || "none";
}

function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Écrit l'instantané du jour (une fois par jour et par périmètre). No-op sans Firestore. */
export async function writeSnapshotIfNeeded(
  subaccounts: string[] | null,
  kpis: Portfolio["kpis"]
): Promise<void> {
  if (!adminConfigured()) return;
  // Pas d'instantané vide (parc non chargé / propriétaire sans accès).
  if (kpis.unitCount === 0) return;
  const key = scopeKey(subaccounts);
  const date = new Date().toISOString().slice(0, 10);
  const ref = adminDb().collection("metrics_snapshots").doc(`${hashKey(key)}_${date}`);
  const existing = await ref.get();
  if (existing.exists) return;
  const snapshot: Snapshot = {
    scopeKey: key,
    date,
    monthlyRevenueCents: kpis.monthlyRevenueCents,
    unitCount: kpis.unitCount,
    buildingCount: kpis.buildingCount,
    ownerCount: 0,
    wontRenewCount: kpis.wontRenewCount,
  };
  await ref.set({ ...snapshot, createdAt: FieldValue.serverTimestamp() });
}

/** Historique (croissant par date) pour un périmètre. Vide si non configuré. */
export async function getSnapshots(
  subaccounts: string[] | null,
  limitN = 180
): Promise<Snapshot[]> {
  if (!adminConfigured()) return [];
  try {
    const key = scopeKey(subaccounts);
    const snap = await adminDb()
      .collection("metrics_snapshots")
      .where("scopeKey", "==", key)
      .get();
    return snap.docs
      .map((d) => d.data() as Snapshot)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-limitN);
  } catch {
    return [];
  }
}

/** Fil d'activité depuis les webhooks persistés (Firestore). Vide si non configuré. */
async function getActivity(subaccounts: string[] | null): Promise<ActivityItem[]> {
  if (!adminConfigured()) return [];
  try {
    const db = adminDb();
    let docs;
    if (subaccounts === null) {
      docs = (await db.collection("plexflow_events").orderBy("receivedAt", "desc").limit(25).get())
        .docs;
    } else if (subaccounts.length === 0) {
      return [];
    } else {
      docs = (
        await db
          .collection("plexflow_events")
          .where("accountName", "in", subaccounts.slice(0, 30))
          .limit(150)
          .get()
      ).docs;
    }
    return docs
      .map((d) => d.data() as PlexflowEvent)
      .map((e) => activityFromEvent(e))
      .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""))
      .slice(0, 25);
  } catch {
    return [];
  }
}

/** Écrit un webhook + projections dans Firestore. Idempotent (doc = eventId). */
export async function persistEvent(evt: PlexflowEvent): Promise<void> {
  const db = adminDb();
  const data = evt.data ?? {};
  const accountId = data.AccountId != null ? String(data.AccountId) : null;
  const accountName = typeof data.AccountName === "string" ? data.AccountName : null;

  const eventDocId =
    evt.eventId || `${evt.eventType ?? "event"}_${evt.entityId ?? "x"}_${evt.timestamp ?? ""}`;

  const batch = db.batch();
  batch.set(
    db.collection("plexflow_events").doc(eventDocId),
    {
      eventId: evt.eventId ?? null,
      eventType: evt.eventType ?? null,
      entityId: evt.entityId ?? null,
      timestamp: evt.timestamp ?? null,
      accountId,
      accountName,
      data,
      receivedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const unit = unitProjectionFromEvent(evt);
  if (unit) batch.set(db.collection("pf_units").doc(unit.unitId), unit, { merge: true });

  const tenant = tenantProjectionFromEvent(evt);
  if (tenant) batch.set(db.collection("pf_tenants").doc(tenant.userId), tenant, { merge: true });

  await batch.commit();
}
