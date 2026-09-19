import type { Metadata } from "next";

import { PassView } from "@/components/pay/pass-view";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Event pass", robots: { index: false } };

export default async function PassPage({ params }: PageProps<"/c/[token]">) {
  const { token } = await params;
  return (
    <div className="bg-surface-100">
      <Container className="py-12 sm:py-16">
        <PassView token={token} />
      </Container>
    </div>
  );
}
