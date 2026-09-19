import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RegisterWizard, WizardFallback } from "@/components/register/register-wizard";
import { Container } from "@/components/ui/primitives";
import { EVENTS, getEvent } from "@/lib/mock/data";

export function generateStaticParams() {
  return EVENTS.filter((e) => e.status === "open").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]/register">): Promise<Metadata> {
  const event = getEvent((await params).slug);
  return { title: event ? `Register · ${event.shortTitle}` : "Register", robots: { index: false } };
}

export default async function RegisterPage({ params }: PageProps<"/events/[slug]/register">) {
  const event = getEvent((await params).slug);
  if (!event || event.status !== "open") notFound();
  return (
    <Container className="pt-6 pb-32 lg:pb-20">
      <Link href={`/events/${event.slug}`} className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-blue-600">
        <ChevronLeft className="size-4" /> {event.title}
      </Link>
      <Suspense fallback={<WizardFallback />}>
        <RegisterWizard event={event} />
      </Suspense>
    </Container>
  );
}
