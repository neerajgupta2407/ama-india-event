import type { Metadata } from "next";

import { EventCard } from "@/components/event/event-card";
import { CalendarDays } from "lucide-react";

import { Container, PageHeader } from "@/components/ui/primitives";
import { formatDateRange } from "@/lib/format";
import { pastEvents, upcomingEvents } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();
  return (
    <>
      <PageHeader eyebrow="Events" icon={CalendarDays} title="Conferences, training & seminars">
        <p className="mt-3 max-w-2xl text-lg text-ink-500">
          Register online with separate member and non-member rates. You’ll get an instant confirmation, a GST invoice and
          a QR pass for check-in.
        </p>
      </PageHeader>
      <Container className="py-14">
        <h2 className="mb-6 text-2xl font-extrabold">Upcoming</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </div>

        <h2 id="past" className="mt-16 mb-6 text-2xl font-extrabold">
          Past events
        </h2>
        <ul className="divide-y divide-line-200 overflow-hidden rounded-[var(--radius-card)] border border-line-200 bg-white">
          {past.map((e) => (
            <li key={e.slug} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="font-bold text-ink-900">{e.title}</p>
                <p className="text-sm text-ink-500">
                  {formatDateRange(e.startsAt, e.endsAt)} · {e.venue}, {e.city}
                </p>
              </div>
              <a href="#" className="text-sm font-bold text-brand-blue-600 hover:underline">
                Presentations & photos
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
