import type { Metadata } from "next";
import { Suspense } from "react";

import ReconciliationPage from "@/components/admin/ReconciliationPage";

export const metadata: Metadata = { title: "Reconciliation" };

// Filters live in the URL (useSearchParams), which needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReconciliationPage />
    </Suspense>
  );
}
