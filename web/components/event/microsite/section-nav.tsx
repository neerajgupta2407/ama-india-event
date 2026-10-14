"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

import { Container } from "@/components/ui/primitives";

// The ai_site in-page menu with its scroll-spy, as a sticky bar under the site header.
export function SectionNav({ items, registerHref }: { items: { id: string; label: string }[]; registerHref?: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const spy = () => {
      const y = window.scrollY + 200;
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

  return (
    <nav
      aria-label="On this page"
      className="sticky top-[110px] z-30 border-b border-line-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90"
    >
      <Container className="flex items-center gap-3">
        <ul className="-mx-1 flex flex-1 gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={active === it.id ? "location" : undefined}
                className={clsx(
                  "block rounded-lg px-3 py-1.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  active === it.id ? "bg-brand-blue-50 text-brand-blue-600" : "text-ink-900 hover:bg-brand-blue-50 hover:text-brand-blue-600",
                )}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
        {registerHref && (
          <a
            href={registerHref}
            className="hidden shrink-0 rounded-[var(--radius-control)] bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-500 md:inline-block"
          >
            Register Now
          </a>
        )}
      </Container>
    </nav>
  );
}
