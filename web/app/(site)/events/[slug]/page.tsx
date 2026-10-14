import { ArrowRight, CalendarDays, Check, Clock, MapPin, Mic2, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { eventAvailability } from "@/components/event/event-card";
import { SectionNav } from "@/components/event/microsite/section-nav";
import {
  About,
  Agenda,
  ContactFaq,
  CountdownBar,
  Gallery,
  Hero,
  Organisations,
  Participate,
  Registration,
  Speakers,
  Themes,
  Venue,
  WhyAttend,
} from "@/components/event/microsite/sections";
import { ButtonLink, Card, Container, Eyebrow, HeroGlow } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/status";
import { formatDate, formatDateRange, formatINR, formatTime } from "@/lib/format";
import { EVENTS, getEvent } from "@/lib/mock/data";
import { quote, seatsLeft } from "@/lib/pricing";
import type { AmaiEvent, Microsite } from "@/lib/types";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const event = getEvent((await params).slug);
  return event ? { title: event.title, description: event.summary } : {};
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const event = getEvent((await params).slug);
  if (!event) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.venue, address: event.city },
    organizer: { "@type": "Organization", name: "Alkali Manufacturers Association of India", url: "https://ama-india.org" },
    offers: event.categories.map((c) => ({
      "@type": "Offer",
      name: c.name,
      price: quote(c).totalPaise / 100,
      priceCurrency: "INR",
      availability: seatsLeft(c) === 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {event.microsite ? <FullMicrosite event={event} site={event.microsite} /> : <CompactEvent event={event} />}
    </>
  );
}

// The ai_site conference page, section for section.
function FullMicrosite({ event, site }: { event: AmaiEvent; site: Microsite }) {
  const nav = [
    { id: "about", label: "About" },
    { id: "agenda", label: "Agenda" },
    { id: "speakers", label: "Speakers" },
    { id: "participate", label: "Participate" },
    { id: "organisations", label: "Organisations" },
    { id: "gallery", label: "Gallery" },
    { id: "venue", label: "Venue" },
    { id: "contact", label: "Contact" },
  ];
  const props = { event, site };
  return (
    <>
      <SectionNav items={nav} registerHref={event.status === "open" ? "#register" : undefined} />
      <Hero {...props} />
      <CountdownBar event={event} />
      <About {...props} />
      <WhyAttend {...props} />
      <Themes {...props} />
      <Agenda {...props} />
      <Speakers {...props} />
      <Participate {...props} />
      <Organisations {...props} />
      <Registration {...props} />
      <Gallery {...props} />
      <Venue {...props} />
      <ContactFaq {...props} />
    </>
  );
}

// Events without microsite content: hero, agenda, speakers and a fee sidebar.
function CompactEvent({ event }: { event: AmaiEvent }) {
  const open = event.status === "open";
  const availability = eventAvailability(event);
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line-200 bg-hero">
        <HeroGlow />
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div className="animate-rise">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={availability.tone}>{availability.label}</Chip>
              <span className="text-sm text-ink-500">{event.tagline}</span>
            </div>
            <h1 className="mt-4 text-[clamp(2.1rem,4.5vw,3.25rem)] leading-[1.1] font-extrabold">{event.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-500">{event.summary}</p>
            <dl className="mt-7 flex flex-wrap gap-2.5 text-sm font-semibold text-ink-900">
              {[
                { icon: CalendarDays, label: "Dates", value: formatDateRange(event.startsAt, event.endsAt) },
                { icon: Clock, label: "Time", value: `${formatTime(event.startsAt)} IST onwards` },
                { icon: MapPin, label: "Venue", value: `${event.venue}, ${event.city}` },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-line-200 bg-white px-4 py-2.5 shadow-[0_6px_16px_rgb(31_111_235/.08)]"
                >
                  <Icon className="size-[18px] text-brand-blue-600" aria-hidden />
                  <dt className="sr-only">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {open && (
            <Card className="p-6 shadow-[var(--shadow-soft)]">
              <p className="text-sm text-ink-500">Registration closes {formatDate(event.registrationClosesAt)}</p>
              <ButtonLink href={`/events/${event.slug}/register`} size="lg" className="mt-3 w-full">
                Register now <ArrowRight className="size-4" />
              </ButtonLink>
              <p className="mt-3 text-xs text-ink-500">Member and non-member rates · UPI, cards, net banking</p>
            </Card>
          )}
        </Container>
      </section>

      {event.highlights.length > 0 && (
        <div className="border-b border-line-200 bg-surface-100">
          <Container className="flex flex-wrap gap-x-8 gap-y-2 py-4 text-sm font-semibold text-ink-700">
            {event.highlights.map((h) => (
              <span key={h} className="inline-flex items-center gap-2">
                <Check className="size-4 text-brand-blue-600" aria-hidden /> {h}
              </span>
            ))}
          </Container>
        </div>
      )}

      <Container className="grid gap-12 py-14 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-14">
          {event.agenda.length > 0 && (
            <section>
              <Eyebrow>Programme</Eyebrow>
              <h2 className="mt-3.5 mb-6 text-[28px] font-extrabold">Agenda</h2>
              <ol className="relative border-l-2 border-brand-blue-100 pl-6">
                {event.agenda.map((a) => (
                  <li key={a.time + a.title} className="relative pb-7 last:pb-0">
                    <span className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-white bg-brand-blue-600 ring-2 ring-brand-blue-100" />
                    <p className="tnum font-mono text-sm text-brand-blue-600">{a.time}</p>
                    <p className="mt-0.5 font-bold text-ink-900">{a.title}</p>
                    {a.speaker && <p className="text-sm text-ink-500">{a.speaker}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {event.speakers.length > 0 && (
            <section>
              <Eyebrow>People</Eyebrow>
              <h2 className="mt-3.5 mb-6 text-[28px] font-extrabold">Speakers</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {event.speakers.map((s, i) => (
                  <li key={i} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line-200 p-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-brand-blue-50 text-brand-blue-600">
                      <Mic2 className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold text-ink-900">{s.name}</p>
                      <p className="text-sm text-ink-500">
                        {s.role} · {s.org}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <Card className="border-2 border-brand-blue-600 p-5 shadow-[0_16px_38px_rgb(31_111_235/.15)] sm:p-6">
            <h2 className="text-xl font-extrabold">Registration fees</h2>
            <ul className="mt-4 divide-y divide-line-200">
              {event.categories.map((c) => {
                const q = quote(c);
                const left = seatsLeft(c);
                return (
                  <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-ink-900">{c.name}</p>
                        <p className="mt-0.5 text-sm text-ink-500">{c.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="tnum font-extrabold text-brand-blue-600">{formatINR(q.taxablePaise)}</p>
                        {q.earlyBird && (
                          <p className="tnum text-xs text-ink-400 line-through">{formatINR(c.baseAmountPaise)}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {q.earlyBird && <Chip tone="info">Early bird till {formatDate(c.earlyBirdUntil!)}</Chip>}
                      {left === 0 ? (
                        <Chip tone="danger">Sold out</Chip>
                      ) : left !== null && left <= 10 ? (
                        <Chip tone="warning" icon={Users}>{left} seats left</Chip>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-ink-500">All fees exclusive of 18% GST. GST invoice issued on payment.</p>
            {open && (
              <ButtonLink href={`/events/${event.slug}/register`} className="mt-5 w-full" size="lg">
                Register now
              </ButtonLink>
            )}
          </Card>
        </aside>
      </Container>
    </>
  );
}
