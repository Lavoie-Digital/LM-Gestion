import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHero } from "@/components/site/page-hero";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de LM Gestion Immobilière — protection des renseignements personnels conformément à la Loi 25 (Québec).",
};

const UPDATED = "16 juillet 2026";

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
              <Section title="1. Portée">
                <p>
                  La présente politique s'applique aux renseignements personnels que {COMPANY.name}
                  {" "}recueille, utilise, communique et conserve dans le cadre de son site web, de
                  son espace client et de ses services de gestion immobilière. Elle est établie
                  conformément à la <em>Loi sur la protection des renseignements personnels dans le
                  secteur privé</em> du Québec, telle que modernisée par la <strong className="text-ink">Loi 25</strong>.
                </p>
              </Section>

              <Section title="2. Responsable de la protection des renseignements personnels">
                <p>
                  {COMPANY.name} a désigné un <strong className="text-ink">responsable de la
                  protection des renseignements personnels</strong>, qui veille au respect de la
                  présente politique et de la Loi 25. Pour toute question, demande d'accès ou
                  plainte, vous pouvez le joindre :
                </p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li>
                    Courriel :{" "}
                    <a href={`mailto:${COMPANY.email}`} className="text-ink underline underline-offset-2">{COMPANY.email}</a>
                  </li>
                  <li>Téléphone : {COMPANY.phone}</li>
                  <li>Adresse : {COMPANY.address}</li>
                </ul>
              </Section>

              <Section title="3. Renseignements que nous recueillons">
                <p>Nous recueillons uniquement les renseignements nécessaires à nos fins :</p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li>
                    <strong className="text-ink">Formulaire de contact</strong> : nom, courriel,
                    téléphone, taille du parc, service recherché et contenu du message.
                  </li>
                  <li>
                    <strong className="text-ink">Espace client (propriétaires)</strong> : adresse
                    courriel d'authentification (et, le cas échéant, identité du compte Google),
                    ainsi que les échanges (notes, messages) et documents que vous déposez ou
                    recevez.
                  </li>
                  <li>
                    <strong className="text-ink">Données de gestion</strong> : renseignements liés
                    aux immeubles, logements, baux, loyers et paiements de votre parc.
                  </li>
                  <li>
                    <strong className="text-ink">Renseignements sur des locataires</strong> : dans
                    le cadre de la gestion pour le compte des propriétaires, nous pouvons traiter des
                    renseignements concernant des locataires (nom, coordonnées, informations de bail).
                    Voir la section 12.
                  </li>
                </ul>
                <p>
                  Nous n'utilisons <strong className="text-ink">aucun outil de suivi publicitaire, de
                  profilage ou de statistiques tierces</strong>. Aucun renseignement personnel n'est
                  vendu ni loué.
                </p>
              </Section>

              <Section title="4. Consentement">
                <p>
                  Nous recueillons vos renseignements avec votre consentement, donné de manière
                  libre et éclairée, ou lorsque la loi le permet. En nous transmettant vos
                  renseignements (formulaire, espace client), vous consentez à leur utilisation aux
                  fins décrites ci-dessous. Vous pouvez retirer votre consentement en tout temps
                  (voir la section 10) ; ce retrait peut toutefois limiter notre capacité à vous
                  offrir certains services.
                </p>
              </Section>

              <Section title="5. Finalités de l'utilisation">
                <p>Vos renseignements servent uniquement à :</p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li>répondre à vos demandes et vous offrir nos services de gestion immobilière ;</li>
                  <li>donner accès à l'espace client et y afficher les données de votre parc ;</li>
                  <li>communiquer avec vous (suivi, accusés de réception, notes, documents, avis) ;</li>
                  <li>respecter nos obligations légales et contractuelles.</li>
                </ul>
                <p>Nous n'utilisons pas vos renseignements à d'autres fins sans votre consentement.</p>
              </Section>

              <Section title="6. Témoins (cookies) et technologies">
                <p>
                  Le site n'utilise que des témoins <strong className="text-ink">strictement
                  nécessaires</strong> au fonctionnement de l'espace client (maintien de votre
                  session d'authentification). Aucun témoin publicitaire, statistique ou de suivi
                  n'est déposé, et aucune technologie d'identification, de localisation ou de
                  profilage n'est activée. Aucun consentement préalable n'est donc requis pour ces
                  témoins essentiels.
                </p>
              </Section>

              <Section title="7. Fournisseurs, sous-traitants et communication à des tiers">
                <p>
                  Nous faisons appel à des fournisseurs de confiance qui traitent certaines données
                  <strong className="text-ink"> pour notre compte</strong> et selon nos instructions,
                  uniquement aux fins décrites ci-dessus :
                </p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li><strong className="text-ink">Google Firebase</strong> — authentification et stockage de l'espace client.</li>
                  <li><strong className="text-ink">SendGrid (Twilio)</strong> — envoi des courriels (formulaire, notifications).</li>
                  <li><strong className="text-ink">PlexFlow</strong> — plateforme de gestion immobilière (données du parc).</li>
                  <li><strong className="text-ink">Anthropic (Claude)</strong> — assistance par intelligence artificielle (voir section 8).</li>
                  <li><strong className="text-ink">Render</strong> — hébergement de l'application.</li>
                </ul>
                <p>
                  Nous ne communiquons vos renseignements à aucun autre tiers sans votre consentement,
                  sauf lorsque la loi l'exige.
                </p>
              </Section>

              <Section title="8. Décisions automatisées et intelligence artificielle">
                <p>
                  Nous utilisons l'intelligence artificielle uniquement comme <strong className="text-ink">aide
                  à la décision</strong>, sous supervision humaine : estimation des loyers du marché
                  et résumé de documents. Aucune décision produisant un effet juridique ou vous
                  affectant de manière significative n'est prise <em>exclusivement</em> à partir d'un
                  traitement automatisé. Si un tel traitement était mis en place, vous en seriez
                  informé et pourriez demander à connaître les renseignements utilisés, les motifs, et
                  à faire réviser la décision par une personne.
                </p>
              </Section>

              <Section title="9. Conservation hors Québec">
                <p>
                  Certains fournisseurs (section 7) peuvent héberger ou traiter des renseignements à
                  l'extérieur du Québec, notamment aux États-Unis. Avant toute communication hors
                  Québec, nous procédons à une <strong className="text-ink">évaluation des facteurs
                  relatifs à la vie privée</strong> (sensibilité des renseignements, finalité,
                  mesures de protection, encadrement juridique applicable) et ne retenons que des
                  fournisseurs offrant une protection adéquate, encadrée par des ententes
                  contractuelles.
                </p>
              </Section>

              <Section title="10. Conservation et destruction">
                <p>
                  Nous conservons vos renseignements aussi longtemps que nécessaire aux fins pour
                  lesquelles ils ont été recueillis, ou selon les exigences légales applicables. Une
                  fois ces fins accomplies, nous les détruisons de façon sécuritaire ou les
                  anonymisons.
                </p>
              </Section>

              <Section title="11. Sécurité et incidents de confidentialité">
                <p>
                  Nous mettons en place des mesures de sécurité raisonnables — accès restreints selon
                  le rôle, authentification, chiffrement en transit, cloisonnement des données par
                  client — afin de protéger vos renseignements contre la perte, l'accès ou la
                  divulgation non autorisés.
                </p>
                <p>
                  En cas d'<strong className="text-ink">incident de confidentialité</strong> présentant
                  un risque de préjudice sérieux, nous prenons les mesures nécessaires pour en
                  diminuer les effets, en avisons la Commission d'accès à l'information ainsi que les
                  personnes concernées, et consignons l'incident dans un registre, conformément à la
                  Loi 25.
                </p>
              </Section>

              <Section title="12. Renseignements concernant des locataires">
                <p>
                  Dans le cadre de la gestion pour le compte de propriétaires, nous pouvons traiter
                  des renseignements concernant des locataires. Nous agissons alors selon les
                  instructions du propriétaire et aux seules fins de la gestion immobilière. Ces
                  renseignements ne sont accessibles qu'aux personnes autorisées et ne sont jamais
                  utilisés à des fins publicitaires. Toute demande d'un locataire relative à ses
                  renseignements peut nous être adressée aux coordonnées de la section 2.
                </p>
              </Section>

              <Section title="13. Vos droits">
                <p>Conformément à la Loi 25, vous avez le droit de :</p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li><strong className="text-ink">accéder</strong> à vos renseignements personnels et en obtenir une copie ;</li>
                  <li><strong className="text-ink">rectifier</strong> des renseignements inexacts, incomplets ou équivoques ;</li>
                  <li><strong className="text-ink">retirer votre consentement</strong> et demander la cessation de la diffusion ou la désindexation ;</li>
                  <li><strong className="text-ink">à la portabilité</strong> : recevoir, dans un format technologique structuré et couramment utilisé, les renseignements informatisés que vous nous avez fournis ;</li>
                  <li>déposer une <strong className="text-ink">plainte</strong> auprès de la Commission d'accès à l'information du Québec.</li>
                </ul>
                <p>
                  Pour exercer ces droits, écrivez au responsable à{" "}
                  <a href={`mailto:${COMPANY.email}`} className="text-ink underline underline-offset-2">{COMPANY.email}</a>.
                  Nous répondons dans un délai maximal de <strong className="text-ink">30 jours</strong>.
                </p>
                <p>
                  Commission d'accès à l'information du Québec :{" "}
                  <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">cai.gouv.qc.ca</a>
                  {" "}· 1 888 528-7741.
                </p>
              </Section>

              <Section title="14. Modifications">
                <p>
                  Cette politique peut être mise à jour pour refléter l'évolution de nos pratiques ou
                  de la loi. La date de la dernière révision figure en haut de la page ; les
                  changements importants vous seront signalés.
                </p>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
