import type { Metadata } from "next";
import { Suspense } from "react";

import RegistrationsPage from "@/components/admin/RegistrationsPage";

export const metadata: Metadata = { title: "Registrations" };

// useSearchParams (filters and the open record live in the URL) needs a Suspense boundary in a static export.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <RegistrationsPage />
    </Suspense>
  );
}
