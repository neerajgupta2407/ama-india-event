import clsx from "clsx";
import Link from "next/link";

// Placeholder mark redrawn from the current raster logo. Replace with AMAI's official SVG (DESIGN_SYSTEM.md §6).
export function Logo({ inverted, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" className={clsx("flex items-center gap-3", className)} aria-label="AMAI home">
      <svg viewBox="0 0 88 36" className="h-9 w-auto shrink-0" aria-hidden>
        <ellipse cx="44" cy="18" rx="43" ry="17" fill={inverted ? "#fff" : "#3D4196"} />
        <text
          x="44"
          y="24.5"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="19"
          letterSpacing="1"
          fill={inverted ? "#3D4196" : "#fff"}
        >
          AMAI
        </text>
      </svg>
      <span className="hidden leading-tight whitespace-nowrap sm:block">
        <span className={clsx("block font-serif text-[15px] font-semibold", inverted ? "text-white" : "text-ink-900")}>
          Alkali Manufacturers
          <br />
          Association of India
        </span>
        {inverted && <span className="mt-1 block text-xs text-white/75 italic">Promoting Sustainable Growth of Alkali Industry</span>}
      </span>
    </Link>
  );
}
