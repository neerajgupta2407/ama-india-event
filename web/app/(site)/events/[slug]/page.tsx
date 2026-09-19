import { ArrowRight, CalendarDays, Check, Clock, MapPin, Mic2, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { eventAvailability } from "@/components/event/event-card";
import { HexPattern } from "@/components/site/hex-pattern";
import { ButtonLink, Card, Container, Eyebrow } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/status";
import { formatDate, formatDateRange, formatINR, formatTime } from "@/lib/format";
import { EVENTS, getEvent } from "@/lib/mock/data";
import { quote, seatsLeft } from "@/lib/pricing";

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
  const open = event.status === "open";
  const availability = eventAvailability(event);

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

      {/* Microsite hero, indigo per DESIGN_SYSTEM §5.2 */}
      <section className="relative isolate overflow-hidden bg-brand-indigo-600 text-white">
        <HexPattern />
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-indigo-600 to-brand-blue-700" />
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div className="animate-rise">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={availability.tone} className="ring-0">{availability.label}</Chip>
              <span className="text-sm text-white/75">{event.tagline}</span>
            </div>
            <h1 className="mt-4 font-serif text-[36px] leading-[1.1] font-bold text-white sm:text-[52px]">{event.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/85">{event.summary}</p>
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-accent-amber-400" aria-hidden />
                <dt className="sr-only">Dates</dt>
                <dd>{formatDateRange(event.startsAt, event.endsAt)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-accent-amber-400" aria-hidden />
                <dt className="sr-only">Time</dt>
                <dd>
                  {formatTime(event.startsAt)} IST onwards
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-accent-amber-400" aria-hidden />
                <dt className="sr-only">Venue</dt>
                <dd>
                  {event.venue}, {event.city}
                </dd>
              </div>
            </dl>
          </div>
          {open && (
            <div className="rounded-[var(--radius-card)] bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur">
              <p className="text-sm text-white/80">Registration closes {formatDate(event.registrationClosesAt)}</p>
              <ButtonLink href={`/events/${event.slug}/register`} variant="amber" size="lg" className="mt-3 w-full">
                Register now <ArrowRight className="size-4" />
              </ButtonLink>
              <p className="mt-3 text-xs text-white/70">Member and non-member rates · UPI, cards, net banking</p>
            </div>
          )}
        </Container>
      </section>

      {event.highlights.length > 0 && (
        <div className="border-b border-line-200 bg-surface-100">
          <Container className="flex flex-wrap gap-x-8 gap-y-2 py-4 text-sm font-medium text-ink-700">
            {event.highlights.map((h) => (
              <span key={h} className="inline-flex items-center gap-2">
                <Check className="size-4 text-success" aria-hidden /> {h}
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
              <h2 className="mt-1 mb-6 font-serif text-[28px] font-semibold">Agenda</h2>
              <ol className="relative border-l-2 border-brand-blue-100 pl-6">
                {event.agenda.map((a) => (
                  <li key={a.time + a.title} className="relative pb-7 last:pb-0">
                    <span className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-white bg-brand-blue-600 ring-2 ring-brand-blue-100" />
                    <p className="tnum font-mono text-sm text-brand-blue-600">{a.time}</p>
                    <p className="mt-0.5 font-semibold text-ink-900">{a.title}</p>
                    {a.speaker && <p className="text-sm text-ink-500">{a.speaker}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {event.speakers.length > 0 && (
            <section>
              <Eyebrow>People</Eyebrow>
              <h2 className="mt-1 mb-6 font-serif text-[28px] font-semibold">Speakers</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {event.speakers.map((s, i) => (
                  <li key={i} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line-200 p-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-indigo-50 text-brand-indigo-600">
                      <Mic2 className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{s.name}</p>
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
          <Card className="p-5 sm:p-6">
            <h2 className="font-serif text-xl font-semibold">Registration fees</h2>
            <ul className="mt-4 divide-y divide-line-200">
              {event.categories.map((c) => {
                const q = quote(c);
                const left = seatsLeft(c);
                return (
                  <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink-900">{c.name}</p>
                        <p className="mt-0.5 text-sm text-ink-500">{c.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="tnum font-semibold text-ink-900">{formatINR(q.taxablePaise)}</p>
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
