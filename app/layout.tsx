import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
    default: "LM Gestion Immobilière — Gestion immobilière haut de gamme",
    template: "%s · LM Gestion Immobilière",
  },
  description:
    "Gestion immobilière haut de gamme au Saguenay. Un parc géré avec exigence, une rentabilité pilotée par la donnée et un espace client intelligent propulsé par l'IA.",
  keywords: [
    "gestion immobilière",
    "gestion locative",
    "immobilier haut de gamme",
    "Saguenay",
    "Chicoutimi",
    "Jonquière",
    "Québec",
    "gestion de parc immobilier",
  ],
  authors: [{ name: "LM Gestion Immobilière" }],
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: SITE_URL,
    title: "LM Gestion Immobilière — Gestion immobilière haut de gamme",
    description:
      "Un parc géré avec exigence, une rentabilité pilotée par la donnée et un espace client intelligent propulsé par l'IA.",
    siteName: "LM Gestion Immobilière",
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
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
        {children}
        {/* Film-grain texture overlay — kept subtle, monochrome, non-interactive */}
        <div aria-hidden className="grain-overlay" />
      </body>
    </html>
  );
}
