import { Construction } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink, Container, Eyebrow, IconTile } from "@/components/ui/primitives";
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
    <div className="bg-soft-fade">
      <Container className="py-20 sm:py-28">
        <div className="mx-auto max-w-xl text-center">
          <IconTile icon={Construction} className="mx-auto" />
          <Eyebrow className="mt-6">Content page</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold capitalize">{label}</h1>
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
    </div>
  );
}
