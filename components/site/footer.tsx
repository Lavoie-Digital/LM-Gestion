import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { COMPANY, NAV_LINKS } from "@/lib/data";
import { Logo } from "./logo";
import { Reveal } from "@/components/ui/reveal";

/* Icônes de marque en SVG inline (absentes de cette version de lucide). */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.5 2c.3 2.1 1.5 3.8 3.5 4.2v3.1c-1.3.05-2.6-.3-3.7-1v6.6c0 3.4-2.7 6.1-6.1 6.1S4.1 18.3 4.1 14.9s2.7-6.1 6.1-6.1c.3 0 .6 0 .9.07v3.2c-.3-.1-.6-.15-.9-.15-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3V2h2.3z" />
    </svg>
  );
}

export function Footer() {
  const year = 2026;

  return (
    <footer id="contact-footer" className="relative overflow-hidden bg-noir text-paper">
      <div className="grid-faint absolute inset-0 opacity-50" aria-hidden />

      <div className="shell relative">
        <div className="grid gap-16 border-b border-line-dark py-20 md:py-28 lg:grid-cols-[1.2fr_1fr_1fr]">
          <Reveal>
            <div>
              <Logo variant="compact" className="text-paper" />
              <p className="mt-7 max-w-sm text-pretty text-[1.0625rem] leading-relaxed text-ash">
                La gestion de votre patrimoine immobilier au Saguenay, menée avec l'exigence
                d'un service privé et la précision de la donnée.
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ash/75">
                Au service de tout le Saguenay–Lac-Saint-Jean : Chicoutimi, Jonquière, La Baie,
                Alma et la région.
              </p>

              <div className="mt-8 flex flex-col gap-3 text-sm text-ash">
                <a
                  href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`}
                  className="group inline-flex items-center gap-3 transition-colors hover:text-paper"
                >
                  <Phone className="size-4 opacity-60" />
                  {COMPANY.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="group inline-flex items-center gap-3 transition-colors hover:text-paper"
                >
                  <Mail className="size-4 opacity-60" />
                  {COMPANY.email}
                </a>
                <span className="inline-flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 opacity-60" />
                  {COMPANY.address}
                </span>
                <span className="inline-flex items-center gap-3">
                  <Clock className="size-4 opacity-60" />
                  {COMPANY.hours}
                </span>
              </div>

              {/* Réseaux sociaux */}
              <div className="mt-7 flex items-center gap-5 text-sm text-ash">
                {COMPANY.social.instagram && (
                  <a
                    href={COMPANY.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-colors hover:text-paper"
                  >
                    <InstagramIcon className="size-4" />
                    Instagram
                  </a>
                )}
                {COMPANY.social.tiktok && (
                  <a
                    href={COMPANY.social.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-colors hover:text-paper"
                  >
                    <TikTokIcon className="size-4" />
                    TikTok
                  </a>
                )}
                {COMPANY.social.facebook && (
                  <a
                    href={COMPANY.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-paper"
                  >
                    Facebook
                  </a>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div>
              <h3 className="kicker text-ash">Navigation</h3>
              <ul className="mt-6 flex flex-col gap-3.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-draw text-[0.95rem] text-paper/85 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div>
              <h3 className="kicker text-ash">Espace client</h3>
              <ul className="mt-6 flex flex-col gap-3.5">
                <li>
                  <Link
                    href="/connexion"
                    className="link-draw inline-flex items-center gap-1 text-[0.95rem] text-paper/85 transition-colors hover:text-paper"
                  >
                    Connexion
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="link-draw text-[0.95rem] text-paper/85 transition-colors hover:text-paper"
                  >
                    Nous joindre
                  </Link>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 py-8 text-xs text-ash md:flex-row">
          <p>
            © {year} {COMPANY.name}. Tous droits réservés.
          </p>
          <p className="text-ash/60">
            Conception ·{" "}
            <a
              href="https://lavoiedigital.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 transition-colors hover:text-paper hover:underline"
            >
              Lavoie Digital
            </a>
          </p>
          <div className="flex items-center gap-6">
            <Link href="/confidentialite" className="transition-colors hover:text-paper">
              Confidentialité
            </Link>
            <Link href="/conditions" className="transition-colors hover:text-paper">
              Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
