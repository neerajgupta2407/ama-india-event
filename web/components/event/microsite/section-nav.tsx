"use client";

import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/site/logo";
import { TopBar } from "@/components/site/header";
import { Container, buttonClass } from "@/components/ui/primitives";

// The microsite's only header, as in ai_site: top bar, logo, in-page menu with scroll-spy and Register Now.
// The site-wide menu is hidden on these pages (see Header), and "Back to AMAI" leads back to it.
export function SectionNav({ items, registerHref }: { items: { id: string; label: string }[]; registerHref?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const spy = () => {
      const y = window.scrollY + 160;
      let cur: string | null = null;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= y) cur = id;
      }
      setActive(cur);
    };
    spy();
    window.addEventListener("scroll", spy, { passive: true });
    return () => window.removeEventListener("scroll", spy);
  }, [items]);

  const link = (it: { id: string; label: string }, mobile?: boolean) => (
    <a
      href={`#${it.id}`}
      onClick={() => setOpen(false)}
      aria-current={active === it.id ? "location" : undefined}
      className={clsx(
        "block rounded-lg font-semibold whitespace-nowrap transition-colors",
        mobile ? "px-3 py-3 text-base" : "px-3 py-2 text-[13.5px]",
        active === it.id ? "bg-brand-blue-50 text-brand-blue-600" : "text-ink-900 hover:bg-brand-blue-50 hover:text-brand-blue-600",
      )}
    >
      {it.label}
    </a>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
      <TopBar backToAmai />
      <div className="border-b border-line-200">
        <Container className="flex h-[72px] items-center justify-between gap-4">
          <Logo />
          <nav aria-label="On this page" className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {items.map((it) => (
                <li key={it.id}>{link(it)}</li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {registerHref && (
              <a href={registerHref} className={buttonClass("primary", "md", "max-sm:hidden")}>
                Register Now
              </a>
            )}
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-lg border border-line-200 bg-white text-ink-900 hover:bg-brand-blue-50 xl:hidden"
              aria-expanded={open}
              aria-controls="microsite-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </Container>
      </div>

      {open && (
        <nav id="microsite-nav" aria-label="On this page" className="absolute inset-x-0 top-full border-b border-line-200 bg-white shadow-[var(--shadow-soft)] xl:hidden">
          <Container className="py-3">
            <ul className="grid gap-0.5 sm:grid-cols-2">
              {items.map((it) => (
                <li key={it.id}>{link(it, true)}</li>
              ))}
            </ul>
            {registerHref && (
              <a href={registerHref} onClick={() => setOpen(false)} className={buttonClass("primary", "lg", "mt-3 w-full sm:hidden")}>
                Register Now
              </a>
            )}
          </Container>
        </nav>
      )}
    </header>
  );
}
