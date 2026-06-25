import Anthropic from "@anthropic-ai/sdk";
import {
  findNeighborhood,
  findUnitType,
  type MarketComp,
  type MarketDriver,
  type MarketResult,
  type Neighborhood,
  type UnitType,
} from "@/lib/market";

/* ------------------------------------------------------------------ *
 * Analyse de marché — route serveur (jamais exécutée côté client).
 *
 * Étapes :
 *   1. Recherche Google (via Serper) des annonces de location pour le
 *      quartier + type choisi. Rapide, fonctionne depuis n'importe quelle IP
 *      (donc OK sur Render), multi-sources (LesPAC, Logis Québec, DuProprio,
 *      Centris, gestionnaires locaux…). Les prix sont dans les titres/snippets.
 *   2. Extraction des prix + statistiques (en code, fiable et gratuit).
 *   3. Claude Haiku transforme ces stats en loyer recommandé + brève analyse.
 *
 * SÉCURITÉ : SERPER_API_KEY et ANTHROPIC_API_KEY sont lues uniquement ici,
 * côté serveur, depuis process.env. Elles ne transitent jamais vers le client.
 * ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SERPER_URL = "https://google.serper.dev/search";
const NUM_RESULTS = 30;
/** Bornes de loyer plausibles (filtre le bruit : prix de vente, frais, aberrations). */
const MIN_RENT = 250;
const MAX_RENT = 6000;

type Organic = { title?: string; snippet?: string; link?: string };

export async function POST(request: Request) {
  const serperKey = process.env.SERPER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const jinaKey = process.env.JINA_API_KEY; // optionnel (Jina Reader marche sans, mais limité)

  if (!serperKey || !anthropicKey) {
    const missing = [
      !serperKey && "SERPER_API_KEY",
      !anthropicKey && "ANTHROPIC_API_KEY",
    ].filter(Boolean);
    return Response.json(
      { error: `Configuration manquante : ${missing.join(", ")}. Ajoutez ces clés au fichier .env.` },
      { status: 503 }
    );
  }

  let body: { neighborhoodId?: string; unitTypeId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const neighborhood = findNeighborhood(body.neighborhoodId ?? "");
  const unitType = findUnitType(body.unitTypeId ?? "");
  if (!neighborhood || !unitType) {
    return Response.json({ error: "Quartier ou type de logement inconnu." }, { status: 400 });
  }

  console.log(`\n[market-analysis] ▶ Analyse demandée — ${neighborhood.label} · ${unitType.label}`);

  // 1 — Recherche Google (Serper) --------------------------------------
  let results: Organic[];
  try {
    results = await searchSerper(serperKey, neighborhood, unitType);
  } catch (err) {
    console.error("[market-analysis] ✖ Erreur Serper :", err);
    return Response.json(
      { error: "La recherche a échoué. Vérifiez SERPER_API_KEY." },
      { status: 502 }
    );
  }
  console.log(`[market-analysis] Serper a renvoyé ${results.length} résultat(s).`);

  // 2 — Prix de base depuis les snippets (instantané, filtré par type) -
  const baseline = extractListings(results, unitType);
  console.log(
    `[market-analysis] Snippets (type « ${unitType.label} ») : ${baseline.prices.length} prix · ${baseline.comps.length} annonces.`
  );

  // 2b — Lecture IA des pages (Jina Reader + Haiku) → annonces précises
  let precise: { comps: MarketComp[]; prices: number[] } = { comps: [], prices: [] };
  try {
    precise = await enrichWithJina(results, neighborhood, unitType, anthropicKey, jinaKey);
    console.log(
      `[market-analysis] Jina/IA : ${precise.comps.length} annonces précises · ${precise.prices.length} prix.`
    );
  } catch (err) {
    console.error("[market-analysis] ✖ Enrichissement Jina/IA :", err);
  }

  // Fusion : annonces précises (URL exactes, filtrées par type par l'IA) en
  // priorité, complétées par les snippets ; dédoublonnage par URL.
  const comps = dedupeComps([...precise.comps, ...baseline.comps]);
  // Pour les STATS : on privilégie les prix précis (filtrés par type). On ne
  // complète avec les snippets que si l'échantillon précis est trop maigre.
  const prices = precise.prices.length >= 3 ? precise.prices : [...precise.prices, ...baseline.prices];
  console.log(
    `[market-analysis] Total : ${prices.length} prix · ${comps.length} annonces (après fusion).`
  );

  const generatedAt = new Date().toISOString();

  if (prices.length === 0) {
    console.log("[market-analysis] ⚠ Aucun prix exploitable — réponse vide.\n");
    return Response.json(emptyResult(neighborhood, unitType, generatedAt));
  }

  const stats = priceStats(prices);
  console.log(
    `[market-analysis] Stats — médiane ${stats.median} $, moyenne ${stats.mean} $, ` +
      `fourchette ${stats.low}–${stats.high} $.`
  );

  // 3 — Analyse Claude Haiku -------------------------------------------
  let ai: AiAnalysis;
  try {
    ai = await analyzeWithHaiku(anthropicKey, { neighborhood: neighborhood.label, unitType: unitType.label, stats, comps });
    console.log(`[market-analysis] ✓ Haiku — loyer ${ai.marketPrice} $, demande « ${ai.demand} ».`);
  } catch (err) {
    console.error("[market-analysis] ✖ Erreur Anthropic :", err);
    ai = {
      marketPrice: stats.median,
      demand: "Modérée",
      summary: `Loyer médian de ${stats.median} $/mois sur ${prices.length} annonces de ${unitType.label} à ${neighborhood.label}.`,
      drivers: [],
    };
  }

  const result: MarketResult = {
    neighborhoodId: neighborhood.id,
    neighborhoodLabel: neighborhood.label,
    unitTypeId: unitType.id,
    unitTypeLabel: unitType.label,
    marketPrice: clamp(ai.marketPrice || stats.median, stats.low, stats.high),
    low: stats.low,
    high: stats.high,
    median: stats.median,
    sampleSize: prices.length,
    demand: ai.demand,
    summary: ai.summary,
    drivers: ai.drivers,
    comps: comps.slice(0, 10),
    generatedAt,
  };

  console.log(
    `[market-analysis] ✔ Réponse — loyer marché ${result.marketPrice} $/mois sur ${result.sampleSize} annonce(s).\n`
  );
  return Response.json(result);
}

/* ------------------------------------------------------------------ *
 * Serper (Google Search API)
 * ------------------------------------------------------------------ */

async function searchSerper(
  apiKey: string,
  neighborhood: Neighborhood,
  unitType: UnitType
): Promise<Organic[]> {
  const query = `appartement ${unitType.query} à louer ${neighborhood.searchLabel} prix par mois`;
  console.log(`[market-analysis] Requête Google : « ${query} »`);

  const res = await fetch(SERPER_URL, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      q: query,
      gl: "ca",
      hl: "fr",
      location: "Saguenay, Quebec, Canada",
      num: NUM_RESULTS,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Serper ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { organic?: Organic[] };
  return Array.isArray(data.organic) ? data.organic : [];
}

/* ------------------------------------------------------------------ *
 * Extraction des prix
 * ------------------------------------------------------------------ */

// Repère un montant en dollars dans un sens ou l'autre : « 1 395 $ », « 785$ »,
// « $1,450 », « C$1 450 », « 1380.00 $ ».
const PRICE_RE = /(?:c\$|\$)\s?([\d][\d.,   ]{0,9}\d|\d)|([\d][\d.,   ]{0,9}\d|\d)\s?\$/gi;

/** Convertit un montant brut (« 1 395 », « 1380.00 », « 1,450 ») en entier $. */
function parseAmount(raw: string): number | null {
  let s = raw.replace(/[^\d.,]/g, "");
  // Retire les cents éventuels (« ,00 » / « .00 »).
  s = s.replace(/[.,]\d{2}$/, "");
  s = s.replace(/[.,]/g, "");
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function pricesInText(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(PRICE_RE)) {
    const raw = m[1] ?? m[2];
    if (!raw) continue;
    const n = parseAmount(raw);
    if (n !== null && n >= MIN_RENT && n <= MAX_RENT) out.push(n);
  }
  return out;
}

function domainOf(link: string | undefined): string | undefined {
  if (!link) return undefined;
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/**
 * Vrai si le texte mentionne le type recherché (« 4 1/2 », « 4½ », ou le
 * nombre de chambres équivalent). Évite que les prix d'autres types
 * (présents dans les snippets d'agrégateurs) polluent l'échantillon.
 */
function textMentionsType(text: string, unitType: UnitType): boolean {
  const t = text.toLowerCase();
  const n = unitType.query.charAt(0); // "2" | "3" | "4" | "5"
  if (new RegExp(`${n}\\s*(?:1\\s*/\\s*2|½)`).test(t)) return true;
  const beds: Record<string, string[]> = {
    "2": ["studio", "bachelor", "0 chambre"],
    "3": ["1 chambre", "1 cac", "1 c.a.c", "1 bedroom", "1 bed"],
    "4": ["2 chambres", "2 cac", "2 c.a.c", "2 bedrooms", "2 beds"],
    "5": ["3 chambres", "3 cac", "3 bedrooms", "3 beds", "4 chambres"],
  };
  return (beds[n] ?? []).some((b) => t.includes(b));
}

/** Extraction de secours depuis les snippets — filtrée par type. */
function extractListings(
  results: Organic[],
  unitType: UnitType
): { comps: MarketComp[]; prices: number[] } {
  const prices: number[] = [];
  const comps: MarketComp[] = [];
  for (const r of results) {
    const text = `${r.title ?? ""} ${r.snippet ?? ""}`;
    if (!textMentionsType(text, unitType)) continue; // ← ne garde que le bon type
    const found = pricesInText(text);
    // Un seul prix = vraie fiche individuelle, fiable. Plusieurs prix = page
    // d'agrégateur (ex. DuProprio « 3 500 $ · 1 020 $ ») : impossible d'associer
    // le bon prix → on ignore (la lecture IA Jina s'en charge proprement).
    if (found.length !== 1) continue;
    prices.push(found[0]);
    comps.push({
      title: (r.title ?? "Annonce").slice(0, 120),
      price: found[0],
      location: domainOf(r.link),
      url: r.link,
    });
  }
  return { comps, prices };
}

function dedupeComps(comps: MarketComp[]): MarketComp[] {
  const seen = new Set<string>();
  const out: MarketComp[] = [];
  for (const c of comps) {
    const key = c.url || `${c.title}|${c.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Lecture IA des pages — Jina Reader + Claude Haiku
 * Lit les pages trouvées, extrait les annonces réelles avec leur URL EXACTE
 * (la fiche précise, pas la page générique) et vérifie le bon type.
 * ------------------------------------------------------------------ */

async function enrichWithJina(
  results: Organic[],
  neighborhood: Neighborhood,
  unitType: UnitType,
  anthropicKey: string,
  jinaKey?: string
): Promise<{ comps: MarketComp[]; prices: number[] }> {
  // Pages candidates : les premiers résultats hors Facebook (login-wall) et
  // pages d'agrégateurs/fiches qui contiennent de vraies annonces.
  const candidates = results
    .map((r) => r.link)
    .filter((u): u is string => !!u && !/facebook\.com/.test(u))
    .slice(0, 5);

  if (candidates.length === 0) return { comps: [], prices: [] };

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const perPage = await Promise.all(
    candidates.map(async (pageUrl) => {
      try {
        const md = await jinaRead(pageUrl, jinaKey);
        console.log(`[market-analysis]   Jina a lu ${domainOf(pageUrl)} (${md.length} car.)`);
        const listings = await extractListingsLLM(anthropic, md, pageUrl, neighborhood, unitType);
        console.log(`[market-analysis]   → ${listings.length} annonce(s) de ${domainOf(pageUrl)}`);
        return listings;
      } catch (err) {
        console.error(`[market-analysis]   ✖ ${domainOf(pageUrl)} :`, (err as Error).message);
        return [];
      }
    })
  );

  const all = perPage.flat();
  return { comps: all, prices: all.map((c) => c.price) };
}

/** Lit une page via Jina Reader → markdown (tronqué). */
async function jinaRead(targetUrl: string, jinaKey?: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${targetUrl}`, {
    headers: {
      "X-Return-Format": "markdown",
      Accept: "text/plain",
      ...(jinaKey ? { Authorization: `Bearer ${jinaKey}` } : {}),
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Jina ${res.status}`);
  const md = await res.text();
  return md.slice(0, 18000);
}

/** Haiku lit le markdown d'une page et en extrait les annonces (URL exactes). */
async function extractListingsLLM(
  anthropic: Anthropic,
  markdown: string,
  pageUrl: string,
  neighborhood: Neighborhood,
  unitType: UnitType
): Promise<MarketComp[]> {
  const system =
    "Tu extrais des annonces de logements à louer depuis le contenu (markdown) d'une page web " +
    "(souvent une page qui liste plusieurs logements, ex. DuProprio, LesPAC). " +
    "Tu réponds UNIQUEMENT avec un tableau JSON valide, sans texte ni bloc de code. " +
    'Format : [{"price": number, "title": string, "url": string}]. ' +
    "RÈGLES STRICTES SUR LE PRIX : price = le LOYER MENSUEL réel de l'annonce (cherche « /mois », " +
    "« par mois », « mensuel », « /m »). Lis attentivement chaque fiche et associe à chaque logement " +
    "SON propre prix. IGNORE absolument : les prix de VENTE, les fourchettes (« à partir de »), les " +
    "prix barrés, les frais, les montants qui ne sont pas un loyer mensuel. Un loyer plausible est " +
    "entre 250 et 6000 $/mois — écarte tout le reste. " +
    "url = le lien EXACT de la fiche, copié tel quel depuis le contenu (jamais inventé, jamais une page " +
    "générique de catégorie). title = titre court. " +
    "Ne garde que les logements qui correspondent au type et au secteur demandés. " +
    "Si aucune annonce pertinente, renvoie []. Maximum 8 annonces.";

  const user =
    `Secteur recherché : ${neighborhood.label} (Saguenay)\n` +
    `Type recherché : ${unitType.label} (${unitType.query})\n` +
    `Page source : ${pageUrl}\n\n` +
    `Contenu de la page :\n${markdown}`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 900,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const arr = parseJsonArrayLoose(text);
  const out: MarketComp[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const price = typeof o.price === "number" ? Math.round(o.price) : null;
    if (price === null || price < MIN_RENT || price > MAX_RENT) continue;
    const title = typeof o.title === "string" && o.title.trim() ? o.title.trim().slice(0, 120) : "Annonce";
    // URL : on n'accepte que si elle est réellement présente dans le contenu
    // lu (anti-hallucination). Sinon, on retombe sur la page source.
    let url = typeof o.url === "string" ? o.url.trim() : "";
    if (!url || !markdown.includes(url)) url = pageUrl;
    out.push({ title, price, location: domainOf(url), url });
  }
  return out;
}

/** Parse le premier tableau JSON d'une réponse (tolère les fences). */
function parseJsonArrayLoose(text: string): unknown[] {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Statistiques
 * ------------------------------------------------------------------ */

type PriceStats = { low: number; high: number; median: number; mean: number; count: number };

function priceStats(prices: number[]): PriceStats {
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;
  const q = (p: number) => sorted[Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))))];
  const median = n % 2 ? sorted[(n - 1) / 2] : Math.round((sorted[n / 2 - 1] + sorted[n / 2]) / 2);
  const mean = Math.round(sorted.reduce((s, v) => s + v, 0) / n);
  return { low: q(0.1), high: q(0.9), median, mean, count: n };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function emptyResult(neighborhood: Neighborhood, unitType: UnitType, generatedAt: string): MarketResult {
  return {
    neighborhoodId: neighborhood.id,
    neighborhoodLabel: neighborhood.label,
    unitTypeId: unitType.id,
    unitTypeLabel: unitType.label,
    marketPrice: 0,
    low: 0,
    high: 0,
    median: 0,
    sampleSize: 0,
    demand: "Indéterminée",
    summary:
      "Aucune annonce avec un prix exploitable n'a été trouvée pour ce secteur et ce type. Essayez « Tout Saguenay » ou un autre type.",
    drivers: [],
    comps: [],
    generatedAt,
  };
}

/* ------------------------------------------------------------------ *
 * Claude Haiku — analyse qualitative
 * ------------------------------------------------------------------ */

type AiAnalysis = {
  marketPrice: number;
  demand: string;
  summary: string;
  drivers: MarketDriver[];
};

async function analyzeWithHaiku(
  apiKey: string,
  ctx: { neighborhood: string; unitType: string; stats: PriceStats; comps: MarketComp[] }
): Promise<AiAnalysis> {
  const anthropic = new Anthropic({ apiKey });

  const sample = ctx.comps
    .slice(0, 15)
    .map((c) => `- ${c.price} $/mois — ${c.title}${c.location ? ` (${c.location})` : ""}`)
    .join("\n");

  const system =
    "Tu es analyste du marché locatif au Saguenay (Québec). Tu reçois des annonces réelles agrégées depuis Google " +
    "(LesPAC, Logis Québec, DuProprio, Centris, gestionnaires locaux…). Tu réponds UNIQUEMENT avec un objet JSON " +
    "valide, sans texte autour, sans bloc de code. Format exact : " +
    '{"marketPrice": number, "demand": "Forte"|"Élevée"|"Modérée"|"Faible", "summary": string, ' +
    '"drivers": [{"label": string, "impact": "up"|"down"|"neutral", "note": string}]}. ' +
    "summary fait 2 à 3 phrases en français, ton professionnel et concret. Donne 2 à 4 drivers. " +
    "marketPrice est le loyer juste recommandé en $/mois, dans la fourchette observée. " +
    "Certaines annonces peuvent venir de secteurs voisins : pondère en conséquence.";

  const user =
    `Quartier : ${ctx.neighborhood}\n` +
    `Type de logement : ${ctx.unitType}\n` +
    `Annonces analysées : ${ctx.stats.count}\n` +
    `Loyer médian : ${ctx.stats.median} $/mois\n` +
    `Loyer moyen : ${ctx.stats.mean} $/mois\n` +
    `Fourchette (p10–p90) : ${ctx.stats.low} $ à ${ctx.stats.high} $\n\n` +
    `Échantillon :\n${sample}\n\n` +
    "Analyse le prix du marché pour ce type de logement dans ce secteur et renvoie le JSON.";

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 700,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = parseJsonLoose(text);
  return {
    marketPrice: typeof parsed.marketPrice === "number" ? parsed.marketPrice : ctx.stats.median,
    demand: typeof parsed.demand === "string" ? parsed.demand : "Modérée",
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : `Loyer médian de ${ctx.stats.median} $/mois sur ${ctx.stats.count} annonces à ${ctx.neighborhood}.`,
    drivers: Array.isArray(parsed.drivers)
      ? parsed.drivers
          .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
          .map((d): MarketDriver => ({
            label: typeof d.label === "string" ? d.label.slice(0, 80) : "Facteur",
            impact: d.impact === "up" || d.impact === "down" ? d.impact : "neutral",
            note: typeof d.note === "string" ? d.note.slice(0, 80) : "",
          }))
          .slice(0, 4)
      : [],
  };
}

/** Extrait et parse le premier objet JSON d'une réponse (tolère les fences). */
function parseJsonLoose(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return {};
  }
}
