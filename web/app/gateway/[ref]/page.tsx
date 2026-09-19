import type { Metadata } from "next";

import { MockCheckout } from "@/components/pay/mock-checkout";

export const metadata: Metadata = { title: "Secure checkout (test mode)", robots: { index: false } };

// Stands in for the provider-hosted checkout (docx §4 step 3). Deliberately unbranded.
export default async function GatewayPage({ params }: PageProps<"/gateway/[ref]">) {
  const { ref } = await params;
  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#1f2430] px-4 py-10 sm:items-center">
      <MockCheckout orderRef={ref} />
    </div>
  );
}
