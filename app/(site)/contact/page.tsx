import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { COMPANY } from "@/lib/data";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "@/components/site/contact-form";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Joignez LM Gestion Immobilière à Chicoutimi (Saguenay). Une rencontre confidentielle suffit pour évaluer le potentiel de votre parc.",
};

const COORDS = [
  { icon: Phone, label: "Téléphone", value: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/[^\d+]/g, "")}` },
  { icon: Mail, label: "Courriel", value: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { icon: MapPin, label: "Bureau", value: COMPANY.address },
  { icon: Clock, label: "Heures", value: "Lun – Ven · 8 h 30 à 17 h" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        label="Contact"
        title={
          <>
            Parlons de votre <span className="italic">patrimoine</span>.
          </>
        }
        intro="Une rencontre confidentielle suffit pour évaluer le potentiel de votre parc et vous présenter notre espace client intelligent."
      />

      <section className="section-y bg-paper">
        <div className="shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Coordinates */}
          <div>
            <Reveal>
              <h2 className="font-display text-3xl tracking-tight">Nous joindre</h2>
              <p className="mt-3 max-w-sm text-pretty leading-relaxed text-smoke">
                Notre équipe de Chicoutimi vous répond rapidement, en toute discrétion.
              </p>
            </Reveal>

            <div className="mt-10 flex flex-col">
              {COORDS.map((c, i) => (
                <Reveal key={c.label} delay={i * 0.06}>
                  <div className="flex items-start gap-4 border-t border-line py-5 first:border-t-0">
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-ink/75">
                      <c.icon className="size-[1.05rem]" strokeWidth={1.6} />
                    </span>
                    <div>
                      <p className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">
                        {c.label}
                      </p>
                      {c.href ? (
                        <a href={c.href} className="mt-1 block text-[1.05rem] text-ink link-draw">
                          {c.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-[1.05rem] text-ink">{c.value}</p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Form */}
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
