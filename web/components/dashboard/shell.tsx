"use client";

import clsx from "clsx";
import { ArrowLeftRight, ExternalLink, LayoutDashboard, RotateCcw, ScanLine, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { resetDemo } from "@/lib/mock/api";

export const STAFF_USER = "ops@ama-india.org";

const NAV = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/dashboard/registrations", label: "Registrations", Icon: Users },
  { href: "/dashboard/check-in", label: "Check-in", Icon: ScanLine },
  { href: "/dashboard/reconciliation", label: "Reconciliation", Icon: ArrowLeftRight },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  return (
    <div className="flex min-h-dvh flex-col bg-surface-100 lg:flex-row">
      <aside className="shrink-0 bg-ink-900 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 items-center rounded-full bg-white px-2.5 font-serif text-sm font-bold text-brand-indigo-600">
              AMAI
            </span>
            <span className="text-sm font-semibold">Events desk</span>
          </Link>
          <Link href="/" className="text-xs text-white/60 hover:text-white lg:hidden">
            View site
          </Link>
        </div>
        <nav aria-label="Dashboard" className="overflow-x-auto px-2 pb-2 lg:flex-1 lg:px-3">
          <ul className="flex gap-1 lg:flex-col">
            {NAV.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                    active(href) ? "bg-white/12 font-semibold text-white" : "text-white/70 hover:bg-white/6 hover:text-white",
                  )}
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden border-t border-white/10 p-4 text-xs text-white/60 lg:block">
          <p className="truncate text-white/85">{STAFF_USER}</p>
          <p>Role: ops · finance (demo)</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-white">
              <ExternalLink className="size-3.5" /> View public site
            </Link>
            <button type="button" onClick={resetDemo} className="inline-flex items-center gap-1.5 text-left hover:text-white">
              <RotateCcw className="size-3.5" /> Reset demo data
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="bg-accent-amber-50 px-4 py-1.5 text-center text-xs text-ink-700">
          Demo dashboard with dummy data. Authentication and MFA come from Django in the real build.
        </div>
        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[28px] leading-tight font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "success" | "warning" | "danger" }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line-200 bg-white p-4 sm:p-5">
      <p className="text-sm text-ink-500">{label}</p>
      <p
        className={clsx(
          "tnum mt-1 font-serif text-2xl font-bold sm:text-3xl",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          !tone && "text-ink-900",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
    </div>
  );
}
