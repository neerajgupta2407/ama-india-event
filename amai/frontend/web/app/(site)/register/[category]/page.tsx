import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RegisterForm from "@/components/register/RegisterForm";
import { CATEGORIES, isCategoryKey } from "@/utils/registration";

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata(props: PageProps<"/register/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  if (!isCategoryKey(category)) return {};
  const { title } = CATEGORIES[category];
  return {
    title: `Register – ${title}`,
    alternates: { canonical: `/register/${category}/` },
    description: `Register as ${title.toLowerCase()} for the 12th AMAI Alkali Industry Conference, 28–29 January 2027, Andaz by Hyatt, Aerocity, New Delhi.`,
  };
}

export default async function RegisterPage(props: PageProps<"/register/[category]">) {
  const { category } = await props.params;
  if (!isCategoryKey(category)) notFound();
  return (
    <main className="ai_reg_main">
      <RegisterForm category={CATEGORIES[category]} />
    </main>
  );
}
