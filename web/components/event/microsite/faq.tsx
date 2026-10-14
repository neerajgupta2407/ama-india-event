"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

// ai_acc: single-open accordion, first item open.
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="overflow-hidden rounded-[14px] border border-line-200 bg-white">
            <h3>
              <button
                type="button"
                id={`${id}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-a${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className={clsx(
                  "flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[15px] font-bold transition-colors",
                  isOpen ? "bg-brand-blue-50 text-brand-blue-600" : "text-ink-900 hover:bg-surface-100",
                )}
              >
                {item.q}
                <ChevronDown
                  className={clsx("size-4 shrink-0 text-brand-blue-600 transition-transform duration-200", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
            </h3>
            <div
              id={`${id}-a${i}`}
              role="region"
              aria-labelledby={`${id}-q${i}`}
              hidden={!isOpen}
              className="px-5 pt-4 pb-5 text-sm text-ink-500"
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
