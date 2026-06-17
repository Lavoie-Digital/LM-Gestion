"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { easeLux } from "@/lib/motion";
import { Logo } from "./logo";
import { ButtonLink } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled
            ? "border-b border-line bg-paper/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <nav className="shell flex h-[4.75rem] items-center justify-between md:h-20">
          <Link
            href="/"
            aria-label="LM Gestion Immobilière — accueil"
            className={cn("transition-colors duration-500", scrolled ? "text-ink" : "text-paper")}
          >
            <Logo />
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "link-draw py-1 text-[0.9rem] tracking-tight transition-colors duration-500",
                    scrolled
                      ? active
                        ? "text-ink"
                        : "text-ink/65 hover:text-ink"
                      : active
                        ? "text-paper"
                        : "text-paper/70 hover:text-paper"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <ButtonLink
              href="/connexion"
              size="sm"
              variant={scrolled ? "dark" : "light"}
              className="hidden sm:inline-flex"
              arrow
            >
              Espace client
            </ButtonLink>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-[2px] transition-colors lg:hidden",
                scrolled ? "text-ink hover:bg-ink/5" : "text-paper hover:bg-paper/10"
              )}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu — kept OUTSIDE <header> so the header's backdrop-blur
          doesn't create a containing block that would shrink this overlay. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] bg-noir text-paper lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: easeLux }}
          >
            <div className="grid-faint absolute inset-0 opacity-60" aria-hidden />
            <div className="relative flex h-full flex-col">
              <div className="shell flex h-[4.75rem] items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer le menu"
                  className="inline-flex size-10 items-center justify-center rounded-[2px] text-paper hover:bg-paper/10"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="shell flex flex-1 flex-col justify-center gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: easeLux, delay: 0.1 + i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-line-dark py-5 font-display text-4xl tracking-tight text-paper/90 transition-colors hover:text-paper"
                    >
                      <span className="mono mr-4 align-middle text-xs text-ash">0{i + 1}</span>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="shell pb-10">
                <ButtonLink
                  href="/connexion"
                  variant="light"
                  size="lg"
                  className="w-full"
                  arrow
                  onClick={() => setOpen(false)}
                >
                  Accéder à l'espace client
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
