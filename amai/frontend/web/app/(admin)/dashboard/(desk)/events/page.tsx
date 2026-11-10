import type { Metadata } from "next";
import { Suspense } from "react";

import EventsPage from "@/components/admin/EventsPage";

export const metadata: Metadata = { title: "Events & fees" };

// Filters live in the URL (useSearchParams), which needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <EventsPage />
    </Suspense>
  );
}
