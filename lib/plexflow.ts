/* ------------------------------------------------------------------ *
 * Client PlexFlow — appels serveur uniquement (clé API jamais exposée).
 *
 * ⚠️ FONDATION À COMPLÉTER : les endpoints réels, la méthode d'auth exacte et
 * le format des réponses dépendent de la documentation API de PlexFlow (pas
 * encore reçue). Ce module fournit le squelette authentifié ; les méthodes
 * concrètes (immeubles, unités, paiements…) seront branchées une fois la doc
 * en main. On normalise toujours les données PlexFlow vers NOS types avant de
 * les exposer à l'app.
 * ------------------------------------------------------------------ */

const BASE_URL = process.env.PLEXFLOW_BASE_URL;
const API_KEY = process.env.PLEXFLOW_API_KEY;

export function plexflowConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY);
}

/**
 * Appel authentifié générique à l'API PlexFlow.
 * NOTE : on suppose `Authorization: Bearer <clé>` — à ajuster selon la doc
 * (certaines API utilisent `X-API-Key`). Centralisé ici pour un seul point
 * de changement.
 */
export async function plexflowFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  if (!BASE_URL || !API_KEY) {
    throw new Error("PlexFlow non configuré (PLEXFLOW_BASE_URL / PLEXFLOW_API_KEY manquants).");
  }
  const url = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PlexFlow ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ *
 * Modèle de données PlexFlow (champs issus de la doc officielle).
 * Réf : help.plexflow.ca → « Données API et événements webhooks ».
 * Les montants de loyer sont en CENTS.
 * ------------------------------------------------------------------ */

export type PlexFlowAddressDetails = {
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  streetName?: string;
  streetNumber?: string;
  postalCode?: string;
  province?: string;
  city?: string;
  country?: string;
};

export type PlexFlowUnit = {
  unitId: string;
  unitNickname?: string;
  unitAddress?: string;
  propertyId?: string;
  propertyNickname?: string;
  propertyAddress?: string;
  subaccount?: string;
  apptNb?: string;
  floorLevel?: string | number;
  surfaceArea?: number;
  unitType?: string;
  hasWaterHeater?: boolean;
  marketPrice?: number;
  marketRenewalPrice?: number;
  propertyAddressDetails?: PlexFlowAddressDetails;
  // Loyer (montants en CENTS)
  rentId?: string;
  rentStatus?: string;
  statuses?: string[];
  rentEnding?: string;
  rentStarting?: string;
  rentBeforeDiscount?: number;
  currentRentBeforeDiscountsCents?: number;
  currentRentDiscountsCents?: number;
  currentRentServicesCents?: number;
  currentRentTotalCents?: number;
  scheduledRentBeforeDiscountsCents?: number;
  scheduledRentDiscountsCents?: number;
  scheduledRentServicesCents?: number;
  scheduledRentTotalCents?: number;
  // Locataires
  tenantsLeaving?: unknown;
  tenantsEntering?: unknown;
  dateTenantLeaving?: string;
  dateTenantEntering?: string;
  enteringDate?: string;
  leavingDate?: string;
  markedWontRenew?: boolean;
  // Disponibilité
  dateAvailableForRent?: string;
  dateAvailableForMaintenance?: string;
};

export type PlexFlowUnitsResponse = { count: number; units: PlexFlowUnit[] };

/** Convertit des cents en dollars (les loyers PlexFlow sont en cents). */
export function centsToDollars(cents: number | undefined): number {
  return typeof cents === "number" ? Math.round(cents / 100) : 0;
}

/* ------------------------------------------------------------------ *
 * Méthodes métier.
 * ⚠️ Le CHEMIN exact de l'endpoint reste à confirmer (réglages API PlexFlow) ;
 * surchargeable via PLEXFLOW_UNITS_PATH. L'enveloppe { count, units } est, elle,
 * documentée.
 * ------------------------------------------------------------------ */

/** Récupère les unités du parc (avec loyer, locataires, dispo). */
export async function getUnits(params?: Record<string, string>): Promise<PlexFlowUnitsResponse> {
  const path = process.env.PLEXFLOW_UNITS_PATH || "units";
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return plexflowFetch<PlexFlowUnitsResponse>(`${path}${qs}`);
}
