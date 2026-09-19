import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { IMPORTANT_LINKS } from "@/lib/mock/data";

import { Container } from "../ui/primitives";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-auto bg-brand-blue-700 text-white/85">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1.2fr]">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            AMAI represents the interests of the Indian alkali industry, promoting continuous improvement in protecting
            human health and the environment through sound science, technology and risk management.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Quick links</h2>
          <ul className="space-y-2.5 text-sm">
            {[
              ["Upcoming events", "/events"],
              ["Members", "/members"],
              ["Publications", "/publications"],
              ["Industry data", "/industry-data"],
              ["Safety, Health & Environment", "/she"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Important links</h2>
          <ul className="space-y-2.5 text-sm">
            {IMPORTANT_LINKS.slice(0, 6).map((l) => (
              <li key={l}>
                <a href="#" className="inline-flex items-start gap-1.5 hover:text-white hover:underline">
                  {l}
                  <ExternalLink className="mt-1 size-3 shrink-0 opacity-60" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Contact</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>AMAI Secretariat, New Delhi (address placeholder)</span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href="mailto:info@ama-india.org" className="hover:text-white hover:underline">
                info@ama-india.org
              </a>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                CERN helpline <span className="tnum font-semibold text-white">1800-11-1735</span>
              </span>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/15">
        <Container className="flex flex-col gap-2 py-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Alkali Manufacturers Association of India</p>
          <p className="flex gap-4">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Refund policy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
