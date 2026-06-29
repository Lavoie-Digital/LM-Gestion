import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHero } from "@/components/site/page-hero";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions d'utilisation du site de LM Gestion Immobilière.",
};

const UPDATED = "29 juin 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-pretty leading-relaxed text-smoke">{children}</div>
    </section>
  );
}

export default function ConditionsPage() {
  return (
    <>
      <PageHero
        index="02"
        label="Conditions"
        title={
          <>
            Conditions <span className="italic">d'utilisation</span>.
          </>
        }
        intro="Les présentes conditions encadrent l'utilisation de ce site web et de l'espace client de LM Gestion Immobilière."
      />

      <div className="section-y bg-paper">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm text-smoke/80">Dernière mise à jour : {UPDATED}</p>

            <div className="mt-10 flex flex-col gap-10">
              <Section title="Acceptation">
                <p>
                  En accédant à ce site, vous acceptez les présentes conditions. Si vous n'y
                  consentez pas, veuillez ne pas l'utiliser.
                </p>
              </Section>

              <Section title="Utilisation du site">
                <p>
                  Vous vous engagez à utiliser le site à des fins licites et à ne pas en
                  perturber le fonctionnement ni tenter d'accéder à des espaces réservés sans
                  autorisation.
                </p>
              </Section>

              <Section title="Espace client">
                <p>
                  L'accès à l'espace client est réservé aux clients autorisés. Vous êtes
                  responsable de la confidentialité de vos identifiants et des activités effectuées
                  sous votre compte.
                </p>
              </Section>

              <Section title="Propriété intellectuelle">
                <p>
                  Le contenu du site (textes, visuels, marque, code) appartient à {COMPANY.name}
                  {" "}ou à ses partenaires et ne peut être reproduit sans autorisation.
                </p>
              </Section>

              <Section title="Exactitude et disponibilité">
                <p>
                  Les informations présentées sont fournies à titre indicatif. Nous nous efforçons
                  de les tenir à jour, sans garantie d'exactitude ou de disponibilité continue du
                  site.
                </p>
              </Section>

              <Section title="Limitation de responsabilité">
                <p>
                  Dans les limites permises par la loi, {COMPANY.name} ne saurait être tenue
                  responsable des dommages découlant de l'utilisation ou de l'impossibilité
                  d'utiliser le site.
                </p>
              </Section>

              <Section title="Liens externes">
                <p>
                  Le site peut contenir des liens vers des sites tiers, sur lesquels nous n'avons
                  aucun contrôle et dont nous ne sommes pas responsables.
                </p>
              </Section>

              <Section title="Droit applicable">
                <p>
                  Les présentes conditions sont régies par les lois applicables au Québec et au
                  Canada.
                </p>
              </Section>

              <Section title="Coordonnées">
                <p>
                  Pour toute question : {COMPANY.phone} ·{" "}
                  <a href={`mailto:${COMPANY.email}`} className="text-ink underline underline-offset-2">
                    {COMPANY.email}
                  </a>
                  .
                </p>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
