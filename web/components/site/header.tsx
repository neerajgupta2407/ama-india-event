"use client";

import clsx from "clsx";
import { ArrowRight, ChevronDown, Mail, Menu, Phone, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SECRETARIAT, hasMicrosite } from "@/lib/mock/data";

import { ButtonLink, Container } from "../ui/primitives";
import { Logo } from "./logo";
import { NAV } from "./nav";

export function CernPill({ compact }: { compact?: boolean }) {
  return (
    <a href={`tel:${SECRETARIAT.cern.tel}`} className="inline-flex items-center gap-1.5 font-semibold text-emergency hover:underline">
      <TriangleAlert className="size-3.5" aria-hidden />
      {compact ? "Chlorine emergency" : "Chlorine Emergency (CERN)"}
      <span className="tnum">{SECRETARIAT.cern.label}</span>
    </a>
  );
}

// ai_topbar: contact line shared by the site header and the conference microsite header.
export function TopBar({ backToAmai }: { backToAmai?: boolean }) {
  return (
    <div className="border-b border-line-200 bg-brand-blue-50 text-[12.5px] text-ink-900">
      <Container className="flex h-9 items-center justify-between gap-4">
        <span className="hidden items-center gap-4 lg:flex">
          <a href={`tel:${SECRETARIAT.phones[0].tel}`} className="inline-flex items-center gap-1.5 hover:text-brand-blue-600">
            <Phone className="size-3.5 text-brand-blue-600" aria-hidden />
            <span className="tnum">{SECRETARIAT.phones[0].label}</span>
          </a>
          <a href={`mailto:${SECRETARIAT.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-blue-600">
            <Mail className="size-3.5 text-brand-blue-600" aria-hidden />
            {SECRETARIAT.email}
          </a>
        </span>
        <span className="sm:hidden">
          <CernPill compact />
        </span>
        <span className="hidden sm:inline">
          <CernPill />
        </span>
        {backToAmai ? (
          <Link href="/" className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-brand-blue-600 hover:underline">
            Back to AMAI <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : (
          <nav aria-label="Utility" className="hidden items-center gap-5 font-semibold text-brand-blue-600 md:flex">
            <Link href="/contact?topic=membership" className="hover:underline">
              Become a member
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Staff login
            </Link>
          </nav>
        )}
      </Container>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // A conference microsite brings its own header (ai_site's in-page menu), so the site menu steps aside.
  const micrositeSlug = /^\/events\/([^/]+)\/?$/.exec(pathname)?.[1];
  if (micrositeSlug && hasMicrosite(micrositeSlug)) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
      <TopBar />

      <div className="border-b border-line-200">
        <Container className="flex h-[72px] items-center justify-between gap-4">
          <Logo />
          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    className={clsx(
                      "my-4 flex h-10 items-center gap-1 rounded-lg px-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                      isActive(item.href)
                        ? "bg-brand-blue-50 text-brand-blue-600"
                        : "text-ink-900 hover:bg-brand-blue-50 hover:text-brand-blue-600",
                    )}
                  >
                    {item.label}
                    {item.children && <ChevronDown className="size-3.5 opacity-60" aria-hidden />}
                  </Link>
                  {item.children && (
                    <div className="invisible absolute top-full left-0 min-w-56 translate-y-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <ul className="rounded-[14px] border border-line-200 bg-white p-2 shadow-[var(--shadow-soft)]">
                        {item.children.map((c) => (
                          <li key={c.label}>
                            <Link
                              href={c.href}
                              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-900 hover:bg-brand-blue-50 hover:text-brand-blue-600"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/#upcoming-events" className="max-sm:hidden">
              Register for events
            </ButtonLink>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-lg border border-line-200 bg-white text-ink-900 hover:bg-brand-blue-50 xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </Container>
      </div>

      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-110px)] overflow-y-auto border-t border-line-200 bg-white xl:hidden">
          <Container className="py-4">
            <ul className="divide-y divide-line-200">
              {NAV.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        className="flex min-h-12 w-full items-center justify-between py-3 text-left text-base font-semibold text-ink-900"
                        aria-expanded={expanded === item.label}
                        onClick={() => setExpanded((e) => (e === item.label ? null : item.label))}
                      >
                        {item.label}
                        <ChevronDown className={clsx("size-5 transition-transform", expanded === item.label && "rotate-180")} />
                      </button>
                      {expanded === item.label && (
                        <ul className="pb-3 pl-3">
                          {item.children.map((c) => (
                            <li key={c.label}>
                              <Link href={c.href} className="block min-h-11 py-2.5 text-ink-700">
                                {c.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} className="flex min-h-12 items-center py-3 text-base font-semibold text-ink-900">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {/* A same-page hash link keeps the pathname, so close the menu on click as well. */}
            <div className="mt-6 grid gap-3" onClick={() => setOpen(false)}>
              <ButtonLink href="/#upcoming-events" size="lg">
                Register for events
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" size="lg">
                Contact AMAI
              </ButtonLink>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
