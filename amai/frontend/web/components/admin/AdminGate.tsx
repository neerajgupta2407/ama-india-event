"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Spinner } from "@/components/admin/ui";
import { URLS } from "@/config/urls";
import { StaffContext } from "@/contexts/StaffContext";
import { useApi } from "@/hooks/useApi";
import type { StaffRole, StaffUser } from "@/types/staff";
import { hasRole } from "@/utils/staff";
import { VIEW_ROLES } from "@/utils/staffHome";

const LOGIN = "/dashboard/login/";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: readonly StaffRole[];
}

const NAV: NavItem[] = [
  { href: "/dashboard/", label: "Overview", icon: "speedometer2", roles: VIEW_ROLES },
  { href: "/dashboard/registrations/", label: "Registrations", icon: "people", roles: VIEW_ROLES },
  { href: "/dashboard/payments/", label: "Payments", icon: "credit-card", roles: VIEW_ROLES },
  { href: "/dashboard/reconciliation/", label: "Reconciliation", icon: "arrow-left-right", roles: VIEW_ROLES },
  { href: "/dashboard/check-in/", label: "Check-in", icon: "qr-code-scan", roles: ["checkin_operator", "ops"] },
  { href: "/dashboard/enquiries/", label: "Enquiries", icon: "chat-left-text", roles: VIEW_ROLES },
  { href: "/dashboard/events/", label: "Events & fees", icon: "calendar-event", roles: VIEW_ROLES },
];

/**
 * Wraps every dashboard page. It asks the API who is signed in; nobody signed in means the
 * login page. The page itself is static, so the real protection is that every API call needs
 * the staff session and the right role.
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { get, post } = useApi();
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await get(URLS.STAFF_CSRF);
        const me = await get<StaffUser>(URLS.STAFF_ME);
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) router.replace(LOGIN);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [get, router]);

  const signedOut = useCallback(() => router.replace(LOGIN), [router]);
  const signOut = useCallback(async () => {
    try {
      await post(URLS.STAFF_LOGOUT);
    } finally {
      router.replace(LOGIN);
    }
  }, [post, router]);
  const value = useMemo(() => (user ? { user, signedOut, signOut } : null), [user, signedOut, signOut]);

  if (!value) return <Spinner label="Checking your session…" />;
  const { user: staff } = value;

  const active = (href: string) => (href === "/dashboard/" ? pathname === href : pathname.startsWith(href));
  return (
    <StaffContext.Provider value={value}>
      <div className="adm-shell">
        <aside className="adm-side">
          <Link href={hasRole(staff, ...VIEW_ROLES) ? "/dashboard/" : "/dashboard/check-in/"} className="adm-brand">
            <span className="logo">AMAI</span> Events desk
          </Link>
          <nav aria-label="Dashboard">
            <ul className="adm-nav">
              {NAV.filter((item) => hasRole(staff, ...item.roles)).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={active(item.href) ? "active" : ""}>
                    <i className={`bi bi-${item.icon}`} aria-hidden="true" /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="adm-user">
            <b>{staff.name}</b>
            <span>{staff.roles.join(" · ") || "no role"}</span>
            <div>
              <button type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </aside>
        <main className="adm-main">{children}</main>
      </div>
    </StaffContext.Provider>
  );
}
