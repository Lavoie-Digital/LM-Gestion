import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StructuredData } from "@/components/site/structured-data";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = "https://lmgestionimmobiliere.ca";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LM Gestion Immobilière — Gestion immobilière au Saguenay–Lac-Saint-Jean",
    template: "%s · LM Gestion Immobilière",
  },
  description:
    "Gestion immobilière et gestion locative clé en main au Saguenay–Lac-Saint-Jean : Chicoutimi, Jonquière, La Baie, Alma et toute la région. Perception des loyers, sélection des locataires, entretien, et optimisation des revenus par l'IA.",
  applicationName: "LM Gestion Immobilière",
  category: "Real Estate",
  keywords: [
    "gestion immobilière",
    "gestion locative",
    "gestion de parc immobilier",
    "gestionnaire immobilier",
    "gestion immobilière Saguenay",
    "gestion immobilière Lac-Saint-Jean",
    "gestion immobilière Alma",
    "gestion locative Alma",
    "Saguenay–Lac-Saint-Jean",
    "Saguenay",
    "Chicoutimi",
    "Jonquière",
    "La Baie",
    "Alma",
    "Roberval",
    "Dolbeau-Mistassini",
    "Saint-Félicien",
    "Québec",
    "perception de loyers",
    "sélection de locataires",
    "optimisation des loyers par l'IA",
    "espace client immobilier",
  ],
  authors: [{ name: "LM Gestion Immobilière" }],
  creator: "LM Gestion Immobilière",
  publisher: "LM Gestion Immobilière",
  alternates: { canonical: "/" },
  formatDetection: { telephone: true, email: true, address: true },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: SITE_URL,
    title: "LM Gestion Immobilière — Gestion immobilière au Saguenay–Lac-Saint-Jean",
    description:
      "Gestion locative clé en main au Saguenay–Lac-Saint-Jean (Chicoutimi, Jonquière, La Baie, Alma). Un parc géré avec exigence et une rentabilité pilotée par la donnée.",
    siteName: "LM Gestion Immobilière",
  },
  twitter: {
    card: "summary_large_image",
    title: "LM Gestion Immobilière — Saguenay–Lac-Saint-Jean",
    description:
      "Gestion immobilière et locative clé en main au Saguenay–Lac-Saint-Jean, incluant Alma.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr-CA"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StructuredData />
        {children}
        {/* Film-grain texture overlay — kept subtle, monochrome, non-interactive */}
        <div aria-hidden className="grain-overlay" />
      </body>
    </html>
  );
}
