import type { Metadata } from "next";
import { Suspense } from "react";

import CheckInPage from "@/components/admin/CheckInPage";

export const metadata: Metadata = { title: "Check-in" };

// Filters live in the URL (useSearchParams), which needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckInPage />
    </Suspense>
  );
}
