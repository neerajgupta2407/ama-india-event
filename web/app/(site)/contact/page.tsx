import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EnquiryForm } from "@/components/contact/enquiry-form";
import { Container, Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <Eyebrow>Contact</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl font-bold">Get in touch with the AMAI secretariat</h1>
        <p className="mt-4 text-ink-500">
          For membership, events, publications or training requests. For a chlorine emergency, call the CERN helpline
          instead.
        </p>
        <ul className="mt-8 space-y-4 text-sm">
          <li className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue-600">
              <Mail className="size-5" aria-hidden />
            </span>
            <a href="mailto:info@ama-india.org" className="font-medium text-brand-blue-600 hover:underline">
              info@ama-india.org
            </a>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-danger-bg text-emergency">
              <Phone className="size-5" aria-hidden />
            </span>
            <span>
              CERN 24×7: <a href="tel:1800111735" className="tnum font-semibold text-ink-900">1800-11-1735</a>
            </span>
          </li>
        </ul>
      </div>
      <Suspense>
        <EnquiryForm />
      </Suspense>
    </Container>
  );
}
