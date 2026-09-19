import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · AMAI Events desk" }, robots: { index: false } };

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <DashboardShell>{children}</DashboardShell>;
}
