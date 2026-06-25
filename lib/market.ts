/* ------------------------------------------------------------------ *
 * Configuration partagée de l'outil d'analyse de marché.
 * Utilisée à la fois par le composant client (sélecteurs) et par la
 * route API serveur (construction de la requête de scraping + analyse).
 * ------------------------------------------------------------------ */

/** Quartiers de Saguenay offerts à la recherche. */
export type Neighborhood = {
  id: string;
  label: string;
  /** Terme de localisation injecté dans la requête Google. */
  searchLabel: string;
};

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: "chicoutimi", label: "Chicoutimi", searchLabel: "Chicoutimi" },
  { id: "jonquiere", label: "Jonquière", searchLabel: "Jonquière" },
  { id: "la-baie", label: "La Baie", searchLabel: "La Baie Saguenay" },
  { id: "saguenay", label: "Tout Saguenay", searchLabel: "Saguenay" },
];

/** Types de logements (nomenclature québécoise). */
export type UnitType = {
  id: string;
  label: string;
  /** Indice de chambres affiché à l'utilisateur. */
  beds: string;
  /** Fragment injecté dans la requête Google (ex. « 4 1/2 »). */
  query: string;
};

export const UNIT_TYPES: UnitType[] = [
  { id: "petit", label: "1½ – 2½", beds: "Studio", query: "2 1/2" },
  { id: "3", label: "3½", beds: "1 chambre", query: "3 1/2" },
  { id: "4", label: "4½", beds: "2 chambres", query: "4 1/2" },
  { id: "5", label: "5½ +", beds: "3 chambres +", query: "5 1/2" },
];

export function findNeighborhood(id: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((n) => n.id === id);
}

export function findUnitType(id: string): UnitType | undefined {
  return UNIT_TYPES.find((t) => t.id === id);
}

/** Une annonce comparable retenue par l'analyse. */
export type MarketComp = {
  title: string;
  price: number;
  location?: string;
  url?: string;
};

export type MarketDriver = {
  label: string;
  impact: "up" | "down" | "neutral";
  note: string;
};

/** Résultat renvoyé par /api/market-analysis. */
export type MarketResult = {
  neighborhoodId: string;
  neighborhoodLabel: string;
  unitTypeId: string;
  unitTypeLabel: string;
  /** Loyer de marché recommandé ($/mois). */
  marketPrice: number;
  low: number;
  high: number;
  median: number;
  /** Nombre d'annonces analysées. */
  sampleSize: number;
  demand: string;
  summary: string;
  drivers: MarketDriver[];
  comps: MarketComp[];
  /** ISO 8601. */
  generatedAt: string;
};
