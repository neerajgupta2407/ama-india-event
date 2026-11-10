import type { Metadata } from "next";
import { Suspense } from "react";

import AttendeePass from "@/components/pass/AttendeePass";

export const metadata: Metadata = {
  title: "Your entry pass",
  // The pass link is a secret. Never send it to other sites as a Referer.
  referrer: "no-referrer",
};

// The pass token travels as /c/?t=..., which a static export reads with useSearchParams inside Suspense.
export default function PassPage() {
  return (
    <main className="py-5">
      <div className="container">
        <Suspense fallback={null}>
          <AttendeePass />
        </Suspense>
      </div>
    </main>
  );
}
