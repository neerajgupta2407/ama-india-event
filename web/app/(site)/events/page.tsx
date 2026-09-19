import type { Metadata } from "next";

import { EventCard } from "@/components/event/event-card";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { formatDateRange } from "@/lib/format";
import { pastEvents, upcomingEvents } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();
  return (
    <>
      <section className="border-b border-line-200 bg-brand-blue-50">
        <Container className="py-12 sm:py-16">
          <Eyebrow>Events</Eyebrow>
          <h1 className="mt-2 font-serif text-4xl font-bold">Conferences, training & seminars</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-500">
            Register online with separate member and non-member rates. You’ll get an instant confirmation, a GST invoice
            and a QR pass for check-in.
          </p>
        </Container>
      </section>
      <Container className="py-12">
        <h2 className="mb-5 font-serif text-2xl font-semibold">Upcoming</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </div>

        <h2 id="past" className="mt-14 mb-5 scroll-mt-32 font-serif text-2xl font-semibold">
          Past events
        </h2>
        <ul className="divide-y divide-line-200 rounded-[var(--radius-card)] border border-line-200">
          {past.map((e) => (
            <li key={e.slug} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="font-medium text-ink-900">{e.title}</p>
                <p className="text-sm text-ink-500">
                  {formatDateRange(e.startsAt, e.endsAt)} · {e.venue}, {e.city}
                </p>
              </div>
              <a href="#" className="text-sm font-medium text-brand-blue-600 hover:underline">
                Presentations & photos
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
