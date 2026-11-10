import type { Metadata } from "next";
import { Suspense } from "react";

import PaymentsPage from "@/components/admin/PaymentsPage";

export const metadata: Metadata = { title: "Payments" };

// Filters live in the URL (useSearchParams), which needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentsPage />
    </Suspense>
  );
}
