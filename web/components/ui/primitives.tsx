import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "amber" | "inverse";
type Size = "md" | "lg" | "sm";

// ai_btn / ai_btn_o from ai_site/css/style.css
const variants: Record<Variant, string> = {
  primary:
    "border-2 border-brand-blue-600 bg-brand-blue-600 text-white shadow-[var(--shadow-btn)] hover:-translate-y-0.5 hover:border-brand-blue-500 hover:bg-brand-blue-500",
  secondary: "border-2 border-brand-blue-600 bg-white text-brand-blue-600 hover:bg-brand-blue-50",
  tertiary: "text-brand-blue-600 hover:bg-brand-blue-50",
  danger: "border-2 border-danger bg-danger text-white hover:bg-[#991b1b]",
  amber:
    "border-2 border-accent-amber-400 bg-accent-amber-400 text-ink-900 shadow-sm hover:-translate-y-0.5 hover:bg-[#eaa322]",
  inverse: "border-2 border-white/60 text-white hover:bg-white/10",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-bold whitespace-nowrap",
    "transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none",
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

// ai_eyebrow: pill label above section titles.
export function Eyebrow({ children, icon: Icon, className }: { children: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <p
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border border-line-200 bg-white px-3.5 py-1.5 text-[11.5px] font-bold tracking-[0.14em] text-brand-blue-600 uppercase",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      {children}
    </p>
  );
}

// ai_card
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("rounded-[var(--radius-card)] border border-line-200 bg-white", className)}>{children}</div>;
}

// ai_ico: soft square icon tile.
export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={clsx("grid size-[54px] shrink-0 place-items-center rounded-[14px] bg-brand-blue-50 text-brand-blue-600", className)}>
      <Icon className="size-6" aria-hidden />
    </span>
  );
}

const sectionTones = { white: "bg-white", soft: "bg-soft", fade: "bg-soft-fade" };

// ai_sec + ai_bg_soft / ai_bg_soft2
export function Section({
  id,
  tone = "white",
  className,
  children,
}: {
  id?: string;
  tone?: keyof typeof sectionTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={clsx("py-16 sm:py-20", sectionTones[tone], className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  icon,
  title,
  sub,
  action,
  center,
}: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={clsx("mb-9 flex flex-wrap gap-4", center ? "flex-col items-center text-center" : "items-end justify-between")}>
      <div className={clsx(center && "flex flex-col items-center")}>
        {eyebrow && <Eyebrow icon={icon}>{eyebrow}</Eyebrow>}
        <h2 className="mt-3.5 text-[clamp(1.6rem,3vw,2.15rem)] leading-tight font-extrabold">{title}</h2>
        {sub && <p className="mt-2.5 max-w-[620px] text-[15.5px] text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// Soft-gradient page header shared by inner pages (events, contact, CMS placeholders).
export function PageHeader({
  eyebrow,
  icon,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("relative isolate overflow-hidden border-b border-line-200 bg-hero", className)}>
      <HeroGlow />
      <Container className="py-12 sm:py-16">
        {eyebrow && <Eyebrow icon={icon}>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] font-extrabold">{title}</h1>
        {children}
      </Container>
    </section>
  );
}

// The two radial blue glows behind ai_hero (::before / ::after).
export function HeroGlow() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-36 -z-10 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(59_139_255/.22),transparent_70%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-44 -bottom-64 -z-10 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(59_139_255/.22),transparent_70%)]"
      />
    </>
  );
}
