import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "amber" | "inverse";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-brand-blue-600 text-white hover:bg-brand-blue-700 shadow-sm",
  secondary: "border border-brand-blue-600 text-brand-blue-600 bg-white hover:bg-brand-blue-50",
  tertiary: "text-brand-blue-600 hover:bg-brand-blue-50",
  danger: "bg-danger text-white hover:bg-[#991b1b]",
  amber: "bg-accent-amber-400 text-ink-900 hover:bg-[#eaa322] shadow-sm",
  inverse: "border border-white/60 text-white hover:bg-white/10",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium whitespace-nowrap",
    "transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className,
  );

export function Button({
  variant,
  size,
  loading,
  className,
  children,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx("text-xs font-semibold uppercase tracking-[0.08em] text-brand-blue-600", className)}>{children}</p>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-card)] border border-line-200 bg-white shadow-[0_1px_2px_rgb(16_24_40/.06),0_1px_3px_rgb(16_24_40/.10)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <Eyebrow className="mb-1">{eyebrow}</Eyebrow>}
        <h2 className="font-serif text-[28px] leading-tight font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}
