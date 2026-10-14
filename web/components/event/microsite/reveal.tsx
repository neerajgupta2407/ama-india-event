"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";

// ai_rv / ai_in: fade sections up as they scroll into view. Replaces the jQuery scroll handler.
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      className={clsx("transition-all duration-700 ease-[var(--ease-standard)]", shown ? "opacity-100" : "translate-y-6 opacity-0", className)}
    >
      {children}
    </div>
  );
}
