import type { Metadata } from "next";

import { Reconciliation } from "@/components/dashboard/reconciliation";

export const metadata: Metadata = { title: "Reconciliation" };

export default function ReconciliationPage() {
  return <Reconciliation />;
}
