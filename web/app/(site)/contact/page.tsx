import { Mail, MapPin, Phone, TriangleAlert, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EnquiryForm } from "@/components/contact/enquiry-form";
import { Container, IconTile, PageHeader } from "@/components/ui/primitives";
import { SECRETARIAT } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" icon={Mail} title="Get in touch with the AMAI secretariat">
        <p className="mt-3 max-w-2xl text-lg text-ink-500">
          For membership, events, publications or training requests. For a chlorine emergency, call the CERN helpline
          instead.
        </p>
      </PageHeader>
      <Container className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_1.6fr]">
        <ul className="text-sm">
          <li className="flex items-start gap-3.5 py-3.5">
            <IconTile icon={MapPin} className="size-[46px]" />
            <div>
              <b className="block text-ink-900">Office</b>
              <span className="text-ink-500">{SECRETARIAT.address}</span>
            </div>
          </li>
          <li className="flex items-start gap-3.5 py-3.5">
            <IconTile icon={UserRound} className="size-[46px]" />
            <div>
              <b className="block text-ink-900">Contact</b>
              <span className="text-ink-500">{SECRETARIAT.contactPerson}</span>
            </div>
          </li>
          <li className="flex items-start gap-3.5 py-3.5">
            <IconTile icon={Phone} className="size-[46px]" />
            <div>
              <b className="block text-ink-900">Phone</b>
              <span className="tnum text-ink-500">
                {SECRETARIAT.phones.map((p, i) => (
                  <span key={p.tel}>
                    {i > 0 && " · "}
                    <a href={`tel:${p.tel}`} className="hover:text-brand-blue-600">
                      {p.label}
                    </a>
                  </span>
                ))}
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3.5 py-3.5">
            <IconTile icon={Mail} className="size-[46px]" />
            <div>
              <b className="block text-ink-900">Email</b>
              <a href={`mailto:${SECRETARIAT.email}`} className="text-brand-blue-600 hover:underline">
                {SECRETARIAT.email}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3.5 py-3.5">
            <IconTile icon={TriangleAlert} className="size-[46px] bg-danger-bg text-emergency" />
            <div>
              <b className="block text-ink-900">Chlorine emergency, 24×7</b>
              <a href={`tel:${SECRETARIAT.cern.tel}`} className="tnum font-bold text-emergency">
                {SECRETARIAT.cern.label}
              </a>
            </div>
          </li>
        </ul>
        <Suspense>
          <EnquiryForm />
        </Suspense>
      </Container>
    </>
  );
}
