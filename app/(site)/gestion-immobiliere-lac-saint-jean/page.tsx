import type { Metadata } from "next";
import { Building2, KeyRound, Scale, Wrench, type LucideIcon } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { COMPANY } from "@/lib/data";

/* Page SEO locale — propriétaires du Lac-Saint-Jean (Alma, Roberval, Dolbeau…). */

const SITE_URL = "https://lmgestionimmobiliere.ca";
const PATH = "/gestion-immobiliere-lac-saint-jean";

export const metadata: Metadata = {
  title: {
    absolute: "Gestion immobilière au Lac-Saint-Jean · Alma, Roberval, Dolbeau | LM Gestion Immobilière",
  },
  description:
    "Gestion immobilière clé en main au Lac-Saint-Jean : Alma, Roberval, Dolbeau-Mistassini, Saint-Félicien et toute la région. Perception des loyers, location, entretien et représentation au TAL.",
  alternates: { canonical: PATH },
  openGraph: { url: PATH },
};

const SERVICES: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: "Perception des loyers",
    text: "Suivi rigoureux des paiements, gestion des retards et rapport mensuel détaillé dans votre espace client.",
    icon: Building2,
  },
  {
    title: "Location de vos logements",
    text: "Photos, annonces, visites, enquête de crédit, vérification au TAL et signature du bail.",
    icon: KeyRound,
  },
  {
    title: "Entretien et urgences",
    text: "Un réseau d'artisans fiables et un service d'urgence 24 h/24, 7 j/7 pour vos locataires.",
    icon: Wrench,
  },
  {
    title: "Tribunal administratif du logement",
    text: "Avis, renouvellements et représentation au TAL, selon les règles en vigueur au Québec.",
    icon: Scale,
  },
];

const TOWNS = [
  "Alma",
  "Roberval",
  "Dolbeau-Mistassini",
  "Saint-Félicien",
  "Saint-Bruno",
  "Hébertville",
  "Métabetchouan–Lac-à-la-Croix",
  "Saint-Prime",
  "Desbiens",
  "Normandin",
];

const FAQ = [
  {
    q: "Est-ce que vous gérez des immeubles à Alma et à Roberval?",
    a: "Oui. Nous gérons des immeubles partout au Saguenay–Lac-Saint-Jean, incluant Alma, Roberval, Dolbeau-Mistassini, Saint-Félicien et les municipalités autour du lac.",
  },
  {
    q: "Mon immeuble est petit. Est-ce que c'est pour moi?",
    a: "Oui. Que vous ayez un duplex ou plusieurs immeubles, nous adaptons notre service à vos besoins.",
  },
  {
    q: "Comment je suis mon immeuble à distance?",
    a: "Votre espace client en ligne vous montre vos revenus, votre occupation, vos documents et vos échanges avec votre gestionnaire, en tout temps.",
  },
];

/** Données structurées propres à la page : service local + FAQ (rattachés à l'entreprise). */
function PageStructuredData() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Gestion immobilière au Lac-Saint-Jean",
      serviceType: "Gestion immobilière et gestion locative",
      url: `${SITE_URL}${PATH}`,
      provider: { "@id": `${SITE_URL}/#business` },
      areaServed: [
        { "@type": "AdministrativeArea", name: "Lac-Saint-Jean" },
        ...TOWNS.map((name) => ({ "@type": "City", name })),
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function LacSaintJeanPage() {
  return (
    <>
      <PageStructuredData />
      <PageHero
        label="Lac-Saint-Jean · Québec"
        title={
          <>
            Gestion immobilière au <span className="italic">Lac-Saint-Jean</span>.
          </>
        }
        intro="D'Alma à Dolbeau-Mistassini, en passant par Roberval et Saint-Félicien, LM Gestion prend en charge votre immeuble à revenus de A à Z. Le même service clé en main que nos propriétaires du Saguenay connaissent, maintenant offert partout autour du lac."
      />

      {/* Pourquoi LM Gestion */}
      <section className="section-y bg-paper">
        <div className="shell">
          <SectionHeader
            index="01"
            label="Pourquoi LM Gestion"
            title={
              <>
                Une gestion rigoureuse, <span className="italic">proche de vous</span>.
              </>
            }
            lede="Vous êtes propriétaire d'un plex ou d'un immeuble à logements au Lac-Saint-Jean? Nous gérons déjà plus de 500 portes au Saguenay–Lac-Saint-Jean, et nous appliquons à chaque immeuble la même exigence : des loyers perçus à temps, des logements loués aux bons locataires et des bâtiments bien entretenus."
          />
          <Stagger className="mt-16 grid grid-cols-1 border-l border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ title, text, icon: Icon }, i) => (
              <StaggerItem
                key={title}
                className="flex flex-col border-b border-r border-line p-8 transition-colors duration-500 hover:bg-paper-2 md:p-10"
              >
                <div className="flex items-start justify-between">
                  <Icon className="size-7 text-ink/80" strokeWidth={1.4} />
                  <span className="kicker text-smoke">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-10 font-display text-[1.45rem] leading-tight tracking-tight">{title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-smoke">{text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Territoire desservi */}
      <section className="section-y border-t border-line bg-paper-2/60">
        <div className="shell">
          <SectionHeader
            index="02"
            label="Territoire desservi"
            title={
              <>
                Partout <span className="italic">autour du lac</span>.
              </>
            }
            lede="Nous desservons les propriétaires des trois MRC du Lac-Saint-Jean : Lac-Saint-Jean-Est, Le Domaine-du-Roy et Maria-Chapdelaine."
          />
          <Reveal delay={0.1}>
            <ul className="mt-12 flex flex-wrap gap-3">
              {TOWNS.map((town) => (
                <li key={town} className="border border-line-strong px-4 py-2 text-[0.95rem] text-ink/85">
                  {town}
                </li>
              ))}
              <li className="border border-line px-4 py-2 text-[0.95rem] text-smoke">Et les environs</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-y border-t border-line bg-paper">
        <div className="shell">
          <SectionHeader
            index="03"
            label="Questions fréquentes"
            title={
              <>
                Ce que les propriétaires du Lac <span className="italic">nous demandent</span>.
              </>
            }
          />
          <Stagger className="mt-14 flex max-w-3xl flex-col border-t border-line">
            {FAQ.map(({ q, a }) => (
              <StaggerItem key={q} className="border-b border-line py-8">
                <h3 className="font-display text-[1.35rem] leading-snug tracking-tight">{q}</h3>
                <p className="mt-3 text-pretty leading-relaxed text-smoke">{a}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="relative overflow-hidden bg-noir text-paper">
        <div className="grid-faint absolute inset-0 opacity-30" aria-hidden />
        <div className="shell relative flex flex-col items-center py-28 text-center md:py-36">
          <Reveal>
            <span className="kicker text-ash">Parlons de votre immeuble</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-7 max-w-3xl text-balance font-display text-[clamp(2.25rem,5.5vw,4.5rem)] font-light leading-[1.02] tracking-[-0.02em]">
              Propriétaire au <span className="italic">Lac-Saint-Jean</span>?
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-7 text-lg text-ash">
              <a href={COMPANY.phoneHref} className="transition-colors hover:text-paper">
                {COMPANY.phone}
              </a>
              {" · "}
              <a href={`mailto:${COMPANY.email}`} className="transition-colors hover:text-paper">
                {COMPANY.email}
              </a>
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10">
              <Magnetic strength={0.4}>
                <ButtonLink href="/contact" variant="light" size="lg">
                  Planifier une rencontre
                </ButtonLink>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
