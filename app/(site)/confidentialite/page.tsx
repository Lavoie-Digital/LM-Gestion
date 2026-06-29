import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHero } from "@/components/site/page-hero";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de LM Gestion Immobilière — protection des renseignements personnels conformément à la Loi 25 (Québec).",
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

export default function ConfidentialitePage() {
  return (
    <>
      <PageHero
        index="01"
        label="Confidentialité"
        title={
          <>
            Politique de <span className="italic">confidentialité</span>.
          </>
        }
        intro="La protection de vos renseignements personnels est une priorité. Cette politique explique quels renseignements nous recueillons, pourquoi, et comment nous les protégeons, conformément à la Loi 25 du Québec."
      />

      <div className="section-y bg-paper">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm text-smoke/80">Dernière mise à jour : {UPDATED}</p>

            <div className="mt-10 flex flex-col gap-10">
              <Section title="Responsable de la protection des renseignements personnels">
                <p>
                  {COMPANY.name} est responsable des renseignements personnels qu'elle détient.
                  Pour toute question relative à cette politique ou à vos renseignements, vous
                  pouvez nous joindre au {COMPANY.phone} ou à{" "}
                  <a href={`mailto:${COMPANY.email}`} className="text-ink underline underline-offset-2">
                    {COMPANY.email}
                  </a>{" "}
                  ({COMPANY.address}).
                </p>
              </Section>

              <Section title="Renseignements que nous recueillons">
                <p>Nous recueillons uniquement les renseignements nécessaires à nos services :</p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li>
                    <strong className="text-ink">Formulaire de contact</strong> : nom, courriel,
                    téléphone, taille du parc, service recherché et message.
                  </li>
                  <li>
                    <strong className="text-ink">Espace client</strong> : adresse courriel (et,
                    le cas échéant, identité du compte Google) utilisée pour l'authentification.
                  </li>
                  <li>
                    <strong className="text-ink">Données de gestion</strong> : pour nos clients
                    propriétaires, les renseignements liés à leurs immeubles et à leur gestion.
                  </li>
                </ul>
                <p>
                  Nous n'utilisons aucun outil de suivi publicitaire ni de profilage. Aucun
                  renseignement n'est vendu.
                </p>
              </Section>

              <Section title="Finalités de la collecte">
                <p>Vos renseignements servent à :</p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li>répondre à vos demandes et vous offrir nos services de gestion ;</li>
                  <li>donner accès à l'espace client et afficher les données de votre parc ;</li>
                  <li>communiquer avec vous (suivi, accusé de réception, gestion courante).</li>
                </ul>
              </Section>

              <Section title="Témoins (cookies)">
                <p>
                  Le site n'utilise que des témoins <strong className="text-ink">strictement
                  nécessaires</strong> au fonctionnement de l'espace client (maintien de votre
                  session d'authentification). Aucun témoin publicitaire, statistique ou de suivi
                  n'est déposé. Aucun consentement préalable n'est donc requis pour ces témoins
                  essentiels.
                </p>
              </Section>

              <Section title="Fournisseurs et communication à des tiers">
                <p>
                  Nous faisons appel à des fournisseurs de confiance qui traitent certaines données
                  pour notre compte, uniquement aux fins décrites ci-dessus :
                </p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li><strong className="text-ink">Google Firebase</strong> — authentification de l'espace client.</li>
                  <li><strong className="text-ink">SendGrid (Twilio)</strong> — envoi des courriels du formulaire de contact.</li>
                  <li><strong className="text-ink">PlexFlow</strong> — plateforme de gestion immobilière (données du parc).</li>
                </ul>
                <p>
                  Certains de ces fournisseurs peuvent héberger ou traiter des données à
                  l'extérieur du Québec (notamment aux États-Unis). Nous prenons des mesures
                  raisonnables pour assurer une protection adéquate de vos renseignements.
                </p>
              </Section>

              <Section title="Conservation des renseignements">
                <p>
                  Nous conservons vos renseignements aussi longtemps que nécessaire aux fins pour
                  lesquelles ils ont été recueillis, ou selon les exigences légales applicables,
                  puis nous les détruisons ou les anonymisons.
                </p>
              </Section>

              <Section title="Sécurité">
                <p>
                  Nous mettons en place des mesures de sécurité raisonnables (accès restreints,
                  authentification, chiffrement en transit) afin de protéger vos renseignements
                  contre la perte, l'accès ou la divulgation non autorisés.
                </p>
              </Section>

              <Section title="Vos droits">
                <p>Conformément à la Loi 25, vous avez le droit de :</p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li>accéder à vos renseignements personnels et en demander une copie ;</li>
                  <li>faire rectifier des renseignements inexacts ou incomplets ;</li>
                  <li>retirer votre consentement et demander la cessation de la diffusion ;</li>
                  <li>déposer une plainte auprès de la Commission d'accès à l'information du Québec (CAI).</li>
                </ul>
                <p>
                  Pour exercer ces droits, écrivez-nous à{" "}
                  <a href={`mailto:${COMPANY.email}`} className="text-ink underline underline-offset-2">
                    {COMPANY.email}
                  </a>
                  .
                </p>
              </Section>

              <Section title="Modifications">
                <p>
                  Cette politique peut être mise à jour. La date de la dernière révision figure en
                  haut de la page.
                </p>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
