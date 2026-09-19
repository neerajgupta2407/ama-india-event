import type { Metadata } from "next";

import { PaymentStatus } from "@/components/pay/payment-status";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Payment status", robots: { index: false } };

export default async function PayStatusPage({ params }: PageProps<"/pay/[ref]">) {
  const { ref } = await params;
  return (
    <Container className="py-14 sm:py-20">
      <PaymentStatus orderRef={ref} />
    </Container>
  );
}
