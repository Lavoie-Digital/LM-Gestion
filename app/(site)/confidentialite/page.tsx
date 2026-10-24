import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHero } from "@/components/site/page-hero";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de LM Gestion Immobilière — protection des renseignements personnels conformément à la Loi 25 (Québec).",
};

const UPDATED = "24 octobre 2026";

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

            <div className="mt-8 rounded-[3px] border border-line bg-paper-2/60 p-6 md:p-8">
              <h2 className="font-display text-xl tracking-tight">En bref</h2>
              <ul className="mt-4 ml-5 flex list-disc flex-col gap-2 text-pretty leading-relaxed text-smoke">
                <li>Chaque propriétaire ne voit <strong className="text-ink">que les données de son propre parc</strong> ; ce cloisonnement est vérifié par nos serveurs à chaque requête.</li>
                <li>Vos données sont <strong className="text-ink">chiffrées</strong> lors de leur transmission (HTTPS) et sur nos serveurs.</li>
                <li>Vos documents ne sont <strong className="text-ink">jamais publics</strong> : ils s'ouvrent par des liens personnels qui expirent après 15 minutes.</li>
                <li>Nous ne vendons, ne louons et ne partageons <strong className="text-ink">aucun</strong> renseignement à des fins publicitaires.</li>
                <li>Vos données ne servent <strong className="text-ink">pas à entraîner</strong> des modèles d'intelligence artificielle.</li>
                <li>Vous pouvez en tout temps demander l'accès, la correction, une copie ou la suppression de vos renseignements.</li>
              </ul>
            </div>

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
                  n'est déposé, et aucune technologie de localisation ou de profilage n'est activée.
                </p>
                <p>
                  <strong className="text-ink">Protection anti-robots (Google reCAPTCHA et Firebase
                  App Check).</strong> Pour protéger l'espace client et vos données contre les
                  robots, les tentatives d'intrusion et les usages abusifs, notre site utilise
                  reCAPTCHA v3 de Google, par l'intermédiaire de Firebase App Check. Ce service
                  vérifie en arrière-plan que les requêtes proviennent bien de notre site, utilisé
                  par une personne réelle. Pour ce faire, il analyse des renseignements techniques
                  sur votre appareil et votre navigation (adresse IP, type de navigateur,
                  interactions avec la page) et peut déposer un témoin technique de Google. Ces
                  renseignements servent <strong className="text-ink">uniquement à la
                  sécurité</strong> : ils ne sont pas utilisés à des fins publicitaires par{" "}
                  {COMPANY.name}, et nous n'y avons pas accès.
                </p>
                <p>
                  Ce site est protégé par reCAPTCHA ; les{" "}
                  <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">Règles de confidentialité</a>
                  {" "}et les{" "}
                  <a href="https://policies.google.com/terms?hl=fr" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">Conditions d'utilisation</a>
                  {" "}de Google s'appliquent. Ces témoins de sécurité étant nécessaires au bon
                  fonctionnement et à la protection du site, ils ne requièrent pas de consentement
                  préalable.
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
                  <li><strong className="text-ink">Google reCAPTCHA et Firebase App Check</strong> — protection du site contre les robots et les accès abusifs (voir section 6).</li>
                  <li><strong className="text-ink">SendGrid (Twilio)</strong> — envoi des courriels (formulaire, notifications).</li>
                  <li><strong className="text-ink">PlexFlow</strong> — plateforme de gestion immobilière (données du parc).</li>
                  <li><strong className="text-ink">Anthropic (Claude)</strong> — assistance par intelligence artificielle (voir section 8).</li>
                  <li><strong className="text-ink">Serper et Jina AI</strong> — recherche d'annonces de location publiques pour l'analyse du marché. Aucun renseignement personnel n'y est transmis.</li>
                  <li><strong className="text-ink">Firebase App Hosting (Google)</strong> — hébergement de l'application.</li>
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
                  traitement automatisé.
                </p>
                <p>
                  L'estimation des loyers du marché repose uniquement sur des{" "}
                  <strong className="text-ink">annonces publiques</strong> : aucun renseignement sur
                  vous ou vos locataires n'est utilisé. Lorsque l'assistance par IA sert à résumer un
                  document, celui-ci est transmis à notre fournisseur (Anthropic) par une connexion
                  chiffrée, <strong className="text-ink">uniquement pour produire le résumé</strong>.
                  Selon les conditions commerciales de ce fournisseur, ces données ne servent pas à
                  entraîner ses modèles. Seule notre équipe de gestion utilise cet outil, jamais de
                  façon automatique.
                </p>
                <p>
                  Si un tel traitement était mis en place, vous en seriez
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
                  Nous protégeons vos renseignements contre la perte, l'accès ou la divulgation non
                  autorisés par plusieurs mesures complémentaires :
                </p>
                <ul className="ml-5 flex list-disc flex-col gap-2">
                  <li>
                    <strong className="text-ink">Chiffrement</strong> : toutes les communications
                    passent par HTTPS (chiffrement en transit, imposé par le navigateur) ; les données
                    et documents sont chiffrés au repos par notre hébergeur (Google Cloud).
                  </li>
                  <li>
                    <strong className="text-ink">Cloisonnement par propriétaire</strong> : nos
                    serveurs vérifient votre identité à chaque requête et ne renvoient que les
                    données de votre propre parc. Le navigateur n'a aucun accès direct à la base de
                    données ni à l'espace de stockage des documents.
                  </li>
                  <li>
                    <strong className="text-ink">Documents protégés</strong> : aucun document n'est
                    accessible publiquement ; chaque consultation passe par un lien personnel et
                    temporaire (15 minutes).
                  </li>
                  <li>
                    <strong className="text-ink">Authentification</strong> : connexion par compte
                    Google, par mot de passe ou par lien à usage unique envoyé par courriel ; tout
                    mot de passe temporaire doit être remplacé dès la première connexion.
                  </li>
                  <li>
                    <strong className="text-ink">Accès restreints</strong> : seules les personnes de
                    notre équipe qui en ont besoin pour la gestion de votre parc ont accès à vos
                    renseignements. Les clés d'accès à nos fournisseurs restent sur nos serveurs et
                    ne sont jamais exposées.
                  </li>
                  <li>
                    <strong className="text-ink">Vérification de l'application</strong> : grâce à
                    Firebase App Check et reCAPTCHA, nos services Firebase vérifient que chaque
                    requête provient bien de notre site légitime, ce qui permet de bloquer les
                    robots et les scripts automatisés.
                  </li>
                  <li>
                    <strong className="text-ink">Protection contre les abus</strong> : limitation
                    du nombre de tentatives de connexion et d'envois, en-têtes de sécurité web
                    (protection contre l'hameçonnage par incrustation et les contenus malveillants).
                  </li>
                </ul>
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
