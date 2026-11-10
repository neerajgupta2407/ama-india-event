"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const MENU_LINKS = "#aiNav .ai_menu_link, #aiNav .ai_dd_item, #aiNav a.ai_btn";

/**
 * Behaviour from the original design that is not markup:
 * Bootstrap collapse/dropdown (data-bs-*), closing the mobile menu after a link,
 * and the reveal-on-scroll animation.
 */
export default function PageEffects() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let closeMenu: ((event: MouseEvent) => void) | undefined;

    Promise.all([import("bootstrap/js/dist/collapse"), import("bootstrap/js/dist/dropdown")]).then(([collapse]) => {
      if (cancelled) return;
      const Collapse = collapse.default;
      closeMenu = (event: MouseEvent) => {
        const link = (event.target as Element | null)?.closest(MENU_LINKS);
        const nav = document.getElementById("aiNav");
        if (link && nav?.classList.contains("show")) {
          Collapse.getOrCreateInstance(nav).hide();
        }
      };
      document.addEventListener("click", closeMenu);
    });

    return () => {
      cancelled = true;
      if (closeMenu) document.removeEventListener("click", closeMenu);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("ai_js");
    const targets = document.querySelectorAll(".ai_rv:not(.ai_in)");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ai_in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
