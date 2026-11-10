import type { Metadata } from "next";
import { Suspense } from "react";

import EnquiriesPage from "@/components/admin/EnquiriesPage";

export const metadata: Metadata = { title: "Enquiries" };

// Filters live in the URL (useSearchParams), which needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <EnquiriesPage />
    </Suspense>
  );
}
