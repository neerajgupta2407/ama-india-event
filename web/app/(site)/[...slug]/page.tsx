import { Construction } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink, Container, Eyebrow } from "@/components/ui/primitives";
import { NAV } from "@/components/site/nav";

export const metadata: Metadata = { title: "Coming soon", robots: { index: false } };

// Placeholder for content pages that will come from Wagtail (IMPLEMENTATION.md §2).
export default async function PlaceholderPage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const label =
    NAV.flatMap((n) => [n, ...(n.children ?? [])]).find((n) => n.href === path)?.label ??
    slug.at(-1)!.replace(/-/g, " ");
  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue-600">
          <Construction className="size-7" aria-hidden />
        </span>
        <Eyebrow className="mt-6">Content page</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl font-bold capitalize">{label}</h1>
        <p className="mt-4 text-ink-500">
          This page’s content will be migrated from the current WordPress site into the CMS. The prototype focuses on
          events, registration, payments and the staff dashboard.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/events">See events</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Home
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
