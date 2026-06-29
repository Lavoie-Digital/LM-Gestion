import { COMPANY } from "@/lib/data";

const SITE_URL = "https://lmgestionimmobiliere.ca";

/** Villes/régions desservies — alimente le SEO local (incl. Alma, Lac-Saint-Jean). */
const AREA_SERVED = [
  "Saguenay",
  "Chicoutimi",
  "Jonquière",
  "La Baie",
  "Arvida",
  "Kénogami",
  "Alma",
  "Roberval",
  "Dolbeau-Mistassini",
  "Saint-Félicien",
];

/**
 * Données structurées Schema.org (JSON-LD). Aident Google ET les moteurs IA à
 * comprendre l'entreprise, ses services et sa zone desservie (tout le
 * Saguenay–Lac-Saint-Jean, Alma inclus). Rendu côté serveur uniquement.
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#business`,
    name: COMPANY.name,
    description:
      "Gestion immobilière et gestion locative clé en main au Saguenay–Lac-Saint-Jean : perception des loyers, sélection des locataires, entretien, et optimisation des revenus par l'intelligence artificielle.",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpg`,
    image: `${SITE_URL}/logo.jpg`,
    telephone: "+1-418-550-0694",
    email: COMPANY.email,
    priceRange: "$$",
    foundingDate: "2023",
    knowsLanguage: ["fr-CA"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "110, rue Racine Est",
      addressLocality: "Chicoutimi",
      addressRegion: "QC",
      postalCode: "G7H 1R1",
      addressCountry: "CA",
    },
    geo: { "@type": "GeoCoordinates", latitude: 48.4283, longitude: -71.0689 },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Saguenay–Lac-Saint-Jean" },
      ...AREA_SERVED.map((name) => ({ "@type": "City", name })),
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:00",
      },
    ],
    sameAs: [COMPANY.social.instagram, COMPANY.social.tiktok, COMPANY.social.facebook].filter(
      Boolean
    ),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
