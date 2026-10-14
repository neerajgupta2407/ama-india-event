import { ExternalLink, Mail, MapPin, Phone, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { IMPORTANT_LINKS, SECRETARIAT } from "@/lib/mock/data";

import { Container } from "../ui/primitives";
import { Logo } from "./logo";
import { SocialLinks } from "./social";

const heading = "mb-4 text-xs font-extrabold tracking-[0.12em] text-ink-900 uppercase";

// ai_footer
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line-200 bg-brand-blue-50 text-sm text-ink-500">
      <Container className="grid gap-10 pt-12 pb-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1.3fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm leading-relaxed">
            AMAI represents the interests of the Indian alkali industry, promoting continuous improvement in protecting
            human health and the environment through sound science, technology and risk management.
          </p>
          <div className="mt-5">
            <SocialLinks />
          </div>
        </div>
        <div>
          <h2 className={heading}>Quick links</h2>
          <ul className="space-y-2.5">
            {[
              ["Upcoming events", "/events"],
              ["Members", "/members"],
              ["Publications", "/publications"],
              ["Industry data", "/industry-data"],
              ["Safety, Health & Environment", "/she"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-brand-blue-600">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={heading}>Important links</h2>
          <ul className="space-y-2.5">
            {IMPORTANT_LINKS.slice(0, 6).map((l) => (
              <li key={l}>
                <a href="#" className="inline-flex items-start gap-1.5 hover:text-brand-blue-600">
                  {l}
                  <ExternalLink className="mt-1 size-3 shrink-0 opacity-60" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={heading}>Secretariat</h2>
          <ul className="space-y-3">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-blue-600" aria-hidden />
              <span>{SECRETARIAT.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-blue-600" aria-hidden />
              <span className="tnum">
                {SECRETARIAT.phones.map((p, i) => (
                  <span key={p.tel}>
                    {i > 0 && " · "}
                    <a href={`tel:${p.tel}`} className="hover:text-brand-blue-600">
                      {p.label}
                    </a>
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand-blue-600" aria-hidden />
              <a href={`mailto:${SECRETARIAT.email}`} className="hover:text-brand-blue-600">
                {SECRETARIAT.email}
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col gap-2 border-t border-line-200 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Alkali Manufacturers Association of India</p>
          <p className="inline-flex items-center gap-1.5 font-semibold text-emergency">
            <TriangleAlert className="size-3.5" aria-hidden />
            For chlorine emergency, dial{" "}
            <a href={`tel:${SECRETARIAT.cern.tel}`} className="tnum hover:underline">
              {SECRETARIAT.cern.label}
            </a>
          </p>
          <p className="flex gap-4">
            <a href="#" className="hover:text-brand-blue-600">Privacy</a>
            <a href="#" className="hover:text-brand-blue-600">Refund policy</a>
            <a href="#" className="hover:text-brand-blue-600">Terms</a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
