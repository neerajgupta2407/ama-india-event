import type { Metadata } from "next";
import { Suspense } from "react";

import { Registrations } from "@/components/dashboard/registrations";

export const metadata: Metadata = { title: "Registrations" };

export default function RegistrationsPage() {
  return (
    <Suspense>
      <Registrations />
    </Suspense>
  );
}
