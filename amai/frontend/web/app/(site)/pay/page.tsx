import type { Metadata } from "next";
import { Suspense } from "react";

import PaymentStatus from "@/components/pay/PaymentStatus";

export const metadata: Metadata = { title: "Payment status" };

// A static export cannot have a dynamic /pay/[ref] segment, so the order reference
// travels as /pay/?ref=ORD-XXXXXXXX.
export default function PayPage() {
  return (
    <main className="ai_reg_main">
      <Suspense fallback={null}>
        <PaymentStatus />
      </Suspense>
    </main>
  );
}
