import clsx from "clsx";
import Link from "next/link";

// ai_brand lockup from ai_site. Still a placeholder mark: replace with AMAI's official SVG (DESIGN_SYSTEM.md §6).
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("flex items-center gap-2.5", className)} aria-label="AMAI home">
      <svg viewBox="0 0 250 100" width="90" height="36" className="h-9 w-auto shrink-0" aria-hidden>
        <ellipse cx="125" cy="50" rx="125" ry="50" fill="#1e3a66" />
        <text
          x="125"
          y="53"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="60"
          letterSpacing="1"
          fill="#fff"
        >
          AMAI
        </text>
      </svg>
      <span className="text-[12px] leading-tight font-bold whitespace-nowrap text-ink-900">
        Alkali Manufacturers
        <br />
        Association of India
      </span>
    </Link>
  );
}
