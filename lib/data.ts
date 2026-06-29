/* ------------------------------------------------------------------ *
 * Demo data for LM Gestion Immobilière (Saguenay, Québec).
 * Everything here is fictional and for presentation only — no real
 * portfolio, tenants, or live integrations are connected.
 * ------------------------------------------------------------------ */

const unsplash = (id: string, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

/* ---------------------------------- *
 * Marketing site — navigation & brand
 * ---------------------------------- */

export const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Approche", href: "/approche" },
  { label: "Portefeuille", href: "/portefeuille" },
  { label: "Contact", href: "/contact" },
] as const;

export const COMPANY = {
  name: "LM Gestion Immobilière",
  tagline: "Gestion immobilière haut de gamme",
  city: "Saguenay",
  region: "Saguenay–Lac-Saint-Jean",
  phone: "(418) 550-0694, poste 2",
  email: "lm.gestion.immobiliere@hotmail.com",
  address: "110, rue Racine Est, Chicoutimi (Québec) G7H 1R1",
  hours: "Lun – Ven, 8 h 30 à 17 h",
  founded: 2023,
  social: {
    // TODO : confirmer l'URL exacte de la page Facebook avec la cliente.
    facebook: "",
    instagram: "https://www.instagram.com/lmgestionimmobiliere",
    tiktok: "https://www.tiktok.com/@lm.gestion.immobi",
  },
};

export type Service = {
  index: string;
  title: string;
  description: string;
  points: string[];
  icon: "building" | "sparkles" | "wrench" | "shield" | "ledger" | "compass";
};

export const SERVICES: Service[] = [
  {
    index: "01",
    title: "Service clé en main",
    description:
      "La gestion complète de votre immeuble, de la perception des loyers à la relation locataire, avec un suivi rigoureux et une communication continue.",
    points: [
      "Perception des loyers et suivi rigoureux des paiements",
      "Gestion des retards de paiement et des avis aux locataires",
      "Service d'urgence et appels 24 h/24, 7 j/7",
      "Représentation auprès du Tribunal administratif du logement (TAL)",
      "Coordination des travaux de maintenance et de réparation",
      "Rapport mensuel détaillé sur la gestion de l'immeuble",
      "Visites d'inspection des lieux deux fois par année",
      "Communication continue avec propriétaires et locataires",
    ],
    icon: "building",
  },
  {
    index: "02",
    title: "Optimisation des revenus · IA",
    description:
      "Une analyse de marché en continu repositionne vos loyers au juste prix et réduit la vacance de votre portefeuille.",
    points: ["Veille de marché en temps réel", "Repositionnement des loyers", "Réduction de la vacance"],
    icon: "sparkles",
  },
  {
    index: "03",
    title: "Entretien & travaux",
    description:
      "Un réseau d'artisans fiable et un partenariat solide avec un entrepreneur général pour préserver la valeur de vos bâtiments.",
    points: [
      "Réparations générales (plomberie, électricité, portes, fenêtres, serrures)",
      "Entretien préventif des aires communes et des systèmes",
      "Rénovation entre deux locations (peinture, planchers, finition)",
      "Réparations d'urgence et interventions rapides",
      "Entretien extérieur et saisonnier",
      "Partenariat solide avec un entrepreneur général",
    ],
    icon: "wrench",
  },
  {
    index: "04",
    title: "Service de location",
    description:
      "De la mise en marché à l'emménagement : photographie, diffusion, enquête approfondie et sélection rigoureuse des locataires.",
    points: [
      "Prise de photos professionnelles du logement",
      "Visite des lieux avec les locataires potentiels",
      "Mise en marché et diffusion des annonces",
      "Réception et analyse des candidatures",
      "Vérification des références de location et d'emploi",
      "Enquête de crédit complète",
      "Vérification des dossiers au Tribunal administratif du logement (TAL)",
      "Vérification des antécédents judiciaires, lorsque permis par la loi",
      "Préparation et signature du bail",
      "Remise des documents et suivi jusqu'à l'emménagement",
    ],
    icon: "shield",
  },
  {
    index: "05",
    title: "Consultation et accompagnement",
    description:
      "Du conseil stratégique à la représentation devant le TAL, un accompagnement offert sur une base horaire ou selon vos besoins.",
    points: [
      "Conseils stratégiques en gestion immobilière",
      "Optimisation des opérations et de la rentabilité",
      "Analyse des pratiques et recommandations d'amélioration",
      "Accompagnement dans la mise en place de processus efficaces",
      "Formation et encadrement du personnel de gestion",
      "Représentation et accompagnement devant le TAL",
      "Service-conseil sur une base horaire ou selon vos besoins",
    ],
    icon: "compass",
  },
];

export type ProcessStep = { index: string; title: string; description: string };

export const PROCESS: ProcessStep[] = [
  {
    index: "01",
    title: "Évaluation",
    description:
      "Audit complet du parc, positionnement de marché et projection de rendement, immeuble par immeuble.",
  },
  {
    index: "02",
    title: "Mise en marché",
    description:
      "Photographie soignée, diffusion premium et sélection rigoureuse pour des locataires à la hauteur de vos actifs.",
  },
  {
    index: "03",
    title: "Gestion",
    description:
      "Perception, entretien, relations locataires et conformité — orchestrés par une équipe dédiée et discrète.",
  },
  {
    index: "04",
    title: "Optimisation",
    description:
      "Pilotage par la donnée et l'IA : ajustement continu des loyers et arbitrages pour maximiser le rendement net.",
  },
];

export type Property = {
  name: string;
  neighborhood: string;
  category: string;
  units: number;
  image: string;
  /** Dimensions natives de la photo (pour respecter le format en mosaïque). */
  width: number;
  height: number;
};

// Vrais immeubles sous gestion — affichés en anonyme (photo + ville), en
// mosaïque qui respecte le format natif de chaque photo. Rendu noir et blanc
// (img-grayscale). Photos fournies par la cliente.
export const PORTFOLIO: Property[] = [
  { name: "imm-1", neighborhood: "Chicoutimi", category: "", units: 0, image: "/chicoutimi-1.jpg", width: 882, height: 465 },
  { name: "imm-2", neighborhood: "La Baie", category: "", units: 0, image: "/la-baie.jpg", width: 592, height: 546 },
  { name: "imm-3", neighborhood: "Chicoutimi", category: "", units: 0, image: "/chicoutimi-6.jpg", width: 1150, height: 499 },
  { name: "imm-4", neighborhood: "Jonquière", category: "", units: 0, image: "/jonquiere.jpg", width: 642, height: 291 },
  { name: "imm-5", neighborhood: "Chicoutimi", category: "", units: 0, image: "/chicoutimi-4.jpg", width: 849, height: 558 },
  { name: "imm-6", neighborhood: "Chicoutimi", category: "", units: 0, image: "/chicoutimi-3.jpg", width: 587, height: 507 },
  { name: "imm-7", neighborhood: "Saint-Honoré", category: "", units: 0, image: "/st-honore-v2.jpg", width: 705, height: 482 },
  { name: "imm-8", neighborhood: "Chicoutimi", category: "", units: 0, image: "/chicoutimi-2.jpg", width: 796, height: 426 },
];

export const HERO_IMAGE = unsplash("1487958449943-2429e8be8625", 1800);
export const APPROACH_IMAGE = unsplash("1431576901776-e539bd916ba2", 1200);
export const CLIENT_TEASER_IMAGE = unsplash("1600607687939-ce8a6c25118c", 1200);

export type Stat = { value: string; label: string };

export const STATS: Stat[] = [
  { value: "511", label: "Logements sous gestion" },
  { value: "98 %", label: "Occupation moyenne" },
  { value: "5,77 M$", label: "Loyers administrés par an" },
  { value: "4,9/5", label: "Satisfaction des propriétaires" },
];

export type Testimonial = { quote: string; author: string; role: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "LM a transformé la gestion de notre parc. La rigueur, la discrétion et la qualité du service sont sans égal au Saguenay.",
    author: "Catherine D.",
    role: "Propriétaire · portefeuille de 40 logements, Jonquière",
  },
  {
    quote:
      "Le tableau de bord en temps réel et l'analyse IA nous ont fait récupérer des milliers de dollars de loyers laissés sur la table.",
    author: "Marc-André L.",
    role: "Investisseur immobilier · Chicoutimi",
  },
  {
    quote:
      "Un service à la hauteur de nos immeubles. On a enfin l'impression que notre patrimoine est entre des mains d'exception.",
    author: "Famille Bélanger",
    role: "Propriétaires · La Baie",
  },
];

export const TRUST_MARQUEE = [
  "Gestion locative",
  "Optimisation par l'IA",
  "Reddition de comptes",
  "Entretien 24/7",
  "Sélection des locataires",
  "Conseil en investissement",
  "Espace client en temps réel",
];

/* ---------------------------------- *
 * Espace client — demo portfolio
 * ---------------------------------- */

export const CLIENT = {
  name: "Gestion Verdure inc.",
  contact: "M. Tremblay",
  advisor: "Laurence M.",
  advisorRole: "Gestionnaire principale",
  since: 2019,
  portfolioName: "Portefeuille Verdure",
};

export type Kpi = {
  key: string;
  label: string;
  value: number;
  display: string;
  delta: number;
  deltaLabel: string;
  trend: "up" | "down" | "flat";
  positive: boolean;
};

export const SECONDARY_STATS = [
  { label: "Loyer moyen", value: "1 247 $" },
  { label: "Taux de perception", value: "99,2 %" },
  { label: "Délai moyen de location", value: "24 j" },
  { label: "Demandes d'entretien actives", value: "7" },
];

const MONTHS = ["Juil", "Août", "Sept", "Oct", "Nov", "Déc", "Janv", "Févr", "Mars", "Avr", "Mai", "Juin"];

export const REVENUE_SERIES: { month: string; value: number }[] = [
  141000, 143500, 146000, 149000, 147500, 151000, 153000, 155000, 157000, 158500, 159500, 160900,
].map((value, i) => ({ month: MONTHS[i], value }));

export const OCCUPANCY_SERIES: { month: string; value: number }[] = [
  87.1, 86.8, 88.0, 88.6, 87.9, 89.2, 89.6, 90.1, 89.4, 90.0, 90.5, 90.8,
].map((value, i) => ({ month: MONTHS[i], value }));

export type Allocation = { label: string; value: number };

export const REVENUE_ALLOCATION: Allocation[] = [
  { label: "Tours & condos", value: 55100 },
  { label: "Prestige résidentiel", value: 48900 },
  { label: "Lofts", value: 34500 },
  { label: "Plex", value: 22400 },
];

export type BuildingRow = {
  name: string;
  neighborhood: string;
  units: number;
  occupied: number;
  monthlyRevenue: number;
  occupancy: number;
  spark: number[];
};

export const BUILDINGS: BuildingRow[] = [
  { name: "Le Racine", neighborhood: "Chicoutimi", units: 28, occupied: 25, monthlyRevenue: 29500, occupancy: 89.3, spark: [84, 86, 85, 88, 87, 89, 89] },
  { name: "Maison Saint-Dominique", neighborhood: "Jonquière", units: 18, occupied: 17, monthlyRevenue: 24100, occupancy: 94.4, spark: [90, 91, 93, 92, 94, 93, 94] },
  { name: "Atelier du Bassin", neighborhood: "Le Bassin", units: 34, occupied: 30, monthlyRevenue: 34500, occupancy: 88.2, spark: [82, 84, 86, 85, 87, 88, 88] },
  { name: "Belvédère du Fjord", neighborhood: "La Baie", units: 16, occupied: 15, monthlyRevenue: 24800, occupancy: 93.8, spark: [88, 90, 91, 90, 92, 93, 94] },
  { name: "Les Cours Arvida", neighborhood: "Arvida", units: 24, occupied: 22, monthlyRevenue: 22400, occupancy: 91.7, spark: [89, 90, 90, 91, 90, 92, 92] },
  { name: "Le Vieux-Port", neighborhood: "Vieux-Port", units: 22, occupied: 20, monthlyRevenue: 25600, occupancy: 90.9, spark: [86, 87, 88, 89, 88, 90, 91] },
];

export type ActivityType =
  | "payment"
  | "lease"
  | "maintenance"
  | "notice"
  | "visit"
  | "ai"
  | "inspection";

export type Activity = { type: ActivityType; title: string; detail: string; time: string };

export const ACTIVITY: Activity[] = [
  { type: "payment", title: "Loyer perçu", detail: "Le Racine #1208 · 1 150 $", time: "il y a 12 min" },
  { type: "lease", title: "Nouveau bail signé", detail: "Atelier du Bassin #304 · 24 mois", time: "il y a 1 h" },
  { type: "maintenance", title: "Demande d'entretien", detail: "Plomberie · Maison Saint-Dominique #5 · priorité moyenne", time: "il y a 2 h" },
  { type: "notice", title: "Préavis de départ reçu", detail: "Les Cours Arvida #112", time: "il y a 5 h" },
  { type: "visit", title: "Visite planifiée", detail: "Belvédère du Fjord #PH2 · demain 14 h", time: "il y a 6 h" },
  { type: "ai", title: "Potentiel réévalué par l'IA", detail: "Le Vieux-Port #410 · +140 $/mois", time: "il y a 8 h" },
  { type: "payment", title: "Loyer perçu", detail: "Maison Saint-Dominique #9 · 1 420 $", time: "hier" },
  { type: "inspection", title: "Inspection complétée", detail: "Conformité · Atelier du Bassin", time: "hier" },
];

export const LIVE_TICKER = [
  "Paiement reçu · Le Racine #1208 · 1 150 $",
  "Veille de marché · 1 248 annonces comparables analysées",
  "Bail signé · Atelier du Bassin #304",
  "Loyer ajusté · Le Vieux-Port #410 · +140 $/mois",
  "Demande d'entretien résolue · Maison Saint-Dominique #5",
];

/* ---------------------------------- *
 * AI vacancy-revenue analysis
 * Market comparables (demo)
 * ---------------------------------- */

export type Comp = {
  title: string;
  neighborhood: string;
  beds: string;
  sqft: number;
  price: number;
  distanceKm: number;
  postedDaysAgo: number;
  match: number;
};

export type Driver = { label: string; impact: "up" | "down"; note: string };

export type VacantUnit = {
  id: string;
  building: string;
  unit: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  floor: string;
  vacantDays: number;
  lastRent: number;
  ai: {
    recommendedLow: number;
    recommendedHigh: number;
    target: number;
    potentialMonthly: number;
    potentialAnnual: number;
    confidence: number;
    marketDelta: number;
    daysToLease: number;
    demand: "Forte" | "Élevée" | "Modérée";
    summary: string;
    drivers: Driver[];
    comps: Comp[];
  };
};

export const VACANT_UNITS: VacantUnit[] = [
  {
    id: "rac-1208",
    building: "Le Racine",
    unit: "#1208",
    type: "4½",
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 920,
    floor: "12ᵉ étage",
    vacantDays: 18,
    lastRent: 1150,
    ai: {
      recommendedLow: 1220,
      recommendedHigh: 1360,
      target: 1290,
      potentialMonthly: 1290,
      potentialAnnual: 15480,
      confidence: 92,
      marketDelta: 12.2,
      daysToLease: 18,
      demand: "Élevée",
      summary:
        "Le marché du centre-ville de Chicoutimi pour un 4½ rénové se situe au-dessus du loyer précédent. L'étage élevé et la vue sur la rivière justifient le haut de la fourchette.",
      drivers: [
        { label: "Étage élevé & vue sur la rivière", impact: "up", note: "+4 % vs comparables" },
        { label: "Rénovation récente (cuisine, salle de bain)", impact: "up", note: "+6 %" },
        { label: "Stationnement non inclus", impact: "down", note: "−2 %" },
      ],
      comps: [
        { title: "Condo 4½ au centre-ville de Chicoutimi", neighborhood: "Chicoutimi", beds: "2 ch", sqft: 880, price: 1340, distanceKm: 0.4, postedDaysAgo: 3, match: 94 },
        { title: "Grand 4½ rénové, près des services", neighborhood: "Chicoutimi", beds: "2 ch", sqft: 950, price: 1250, distanceKm: 0.8, postedDaysAgo: 6, match: 89 },
        { title: "4½ avec balcon et vue", neighborhood: "Chicoutimi", beds: "2 ch", sqft: 905, price: 1325, distanceKm: 1.1, postedDaysAgo: 2, match: 87 },
        { title: "Moderne 2 chambres, rue Racine", neighborhood: "Chicoutimi", beds: "2 ch", sqft: 870, price: 1280, distanceKm: 0.6, postedDaysAgo: 9, match: 85 },
      ],
    },
  },
  {
    id: "bas-304",
    building: "Atelier du Bassin",
    unit: "#304",
    type: "3½",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 690,
    floor: "3ᵉ étage",
    vacantDays: 9,
    lastRent: 980,
    ai: {
      recommendedLow: 1020,
      recommendedHigh: 1160,
      target: 1075,
      potentialMonthly: 1075,
      potentialAnnual: 12900,
      confidence: 88,
      marketDelta: 9.7,
      daysToLease: 14,
      demand: "Forte",
      summary:
        "Le secteur du Bassin attire les jeunes professionnels et la clientèle de l'UQAC. La demande pour les lofts 3½ neufs absorbe rapidement une hausse mesurée du loyer.",
      drivers: [
        { label: "Demande locative soutenue (UQAC)", impact: "up", note: "+5 %" },
        { label: "Style loft & finitions modernes", impact: "up", note: "+3 %" },
        { label: "Proximité de la rivière Saguenay", impact: "up", note: "+2 %" },
      ],
      comps: [
        { title: "Loft 3½ au Bassin avec stationnement", neighborhood: "Le Bassin", beds: "1 ch", sqft: 720, price: 1150, distanceKm: 0.3, postedDaysAgo: 1, match: 92 },
        { title: "Condo loft lumineux, bord de l'eau", neighborhood: "Le Bassin", beds: "1 ch", sqft: 660, price: 1050, distanceKm: 0.5, postedDaysAgo: 4, match: 90 },
        { title: "3½ neuf, secteur du Bassin", neighborhood: "Le Bassin", beds: "1 ch", sqft: 700, price: 1080, distanceKm: 0.9, postedDaysAgo: 7, match: 86 },
      ],
    },
  },
  {
    id: "fjo-ph2",
    building: "Belvédère du Fjord",
    unit: "#PH2",
    type: "5½",
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1640,
    floor: "Penthouse",
    vacantDays: 27,
    lastRent: 2050,
    ai: {
      recommendedLow: 2180,
      recommendedHigh: 2520,
      target: 2340,
      potentialMonthly: 2340,
      potentialAnnual: 28080,
      confidence: 84,
      marketDelta: 14.1,
      daysToLease: 30,
      demand: "Modérée",
      summary:
        "Segment de luxe à rotation plus lente mais à forte valeur. Les comparables de penthouses avec vue sur le fjord à La Baie soutiennent un loyer premium.",
      drivers: [
        { label: "Penthouse, terrasse privée", impact: "up", note: "+8 %" },
        { label: "Vue panoramique sur le fjord", impact: "up", note: "+5 %" },
        { label: "Segment de luxe — bassin restreint", impact: "down", note: "délai plus long" },
      ],
      comps: [
        { title: "Penthouse vue sur le fjord, La Baie", neighborhood: "La Baie", beds: "3 ch", sqft: 1700, price: 2500, distanceKm: 0.7, postedDaysAgo: 5, match: 90 },
        { title: "Grand 5½ haut de gamme", neighborhood: "La Baie", beds: "3 ch", sqft: 1580, price: 2250, distanceKm: 1.4, postedDaysAgo: 11, match: 83 },
        { title: "Condo de luxe avec terrasse, baie des Ha! Ha!", neighborhood: "La Baie", beds: "3 ch", sqft: 1560, price: 2380, distanceKm: 1.0, postedDaysAgo: 8, match: 81 },
      ],
    },
  },
  {
    id: "arv-112",
    building: "Les Cours Arvida",
    unit: "#112",
    type: "4½",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 840,
    floor: "Rez-de-chaussée",
    vacantDays: 5,
    lastRent: 950,
    ai: {
      recommendedLow: 1000,
      recommendedHigh: 1120,
      target: 1050,
      potentialMonthly: 1050,
      potentialAnnual: 12600,
      confidence: 90,
      marketDelta: 10.5,
      daysToLease: 16,
      demand: "Élevée",
      summary:
        "Arvida attire les familles par son cachet patrimonial et ses écoles. Un 4½ près des services se reloue vite à un loyer ajusté au marché actuel.",
      drivers: [
        { label: "Secteur patrimonial recherché", impact: "up", note: "+4 %" },
        { label: "Rangement et cour partagée", impact: "up", note: "+2 %" },
        { label: "Rez-de-chaussée", impact: "down", note: "−3 %" },
      ],
      comps: [
        { title: "4½ Arvida, secteur patrimonial", neighborhood: "Arvida", beds: "2 ch", sqft: 820, price: 1080, distanceKm: 0.4, postedDaysAgo: 2, match: 93 },
        { title: "Appartement 2 chambres rénové", neighborhood: "Arvida", beds: "2 ch", sqft: 860, price: 1000, distanceKm: 0.6, postedDaysAgo: 5, match: 88 },
        { title: "Grand 4½ familial, près de l'école", neighborhood: "Arvida", beds: "2 ch", sqft: 880, price: 1040, distanceKm: 1.2, postedDaysAgo: 9, match: 84 },
      ],
    },
  },
  {
    id: "vpt-410",
    building: "Le Vieux-Port",
    unit: "#410",
    type: "4½",
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 980,
    floor: "4ᵉ étage",
    vacantDays: 14,
    lastRent: 1250,
    ai: {
      recommendedLow: 1320,
      recommendedHigh: 1480,
      target: 1390,
      potentialMonthly: 1390,
      potentialAnnual: 16680,
      confidence: 87,
      marketDelta: 11.2,
      daysToLease: 19,
      demand: "Élevée",
      summary:
        "Le cachet du Vieux-Port de Chicoutimi et la proximité de la marina commandent une prime. Les comparables récents confirment un repositionnement à la hausse.",
      drivers: [
        { label: "Cachet patrimonial (pierre & bois)", impact: "up", note: "+6 %" },
        { label: "Proximité de la marina & des croisières", impact: "up", note: "+3 %" },
        { label: "Bruit de rue en soirée", impact: "down", note: "−1 %" },
      ],
      comps: [
        { title: "Condo Vieux-Port plein de cachet", neighborhood: "Vieux-Port", beds: "2 ch", sqft: 1000, price: 1480, distanceKm: 0.3, postedDaysAgo: 3, match: 91 },
        { title: "4½ pierre et bois, vue sur la marina", neighborhood: "Vieux-Port", beds: "2 ch", sqft: 940, price: 1350, distanceKm: 0.7, postedDaysAgo: 6, match: 88 },
        { title: "Loft patrimonial, Vieux-Port", neighborhood: "Vieux-Port", beds: "2 ch", sqft: 1020, price: 1420, distanceKm: 0.9, postedDaysAgo: 4, match: 85 },
      ],
    },
  },
];

export const AI_SUMMARY = {
  vacantTotal: 13,
  prioritized: VACANT_UNITS.length,
  potentialMonthly: VACANT_UNITS.reduce((s, u) => s + u.ai.potentialMonthly, 0),
  potentialAnnual: VACANT_UNITS.reduce((s, u) => s + u.ai.potentialAnnual, 0),
  listingsScanned: 1248,
  avgConfidence: Math.round(
    VACANT_UNITS.reduce((s, u) => s + u.ai.confidence, 0) / VACANT_UNITS.length
  ),
};

/** Portfolio-wide dormant revenue projection across all vacant units. */
export const DORMANT_ANNUAL = 222900;
