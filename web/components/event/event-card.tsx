import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import { formatDateRange, formatINRShort, dayOf, monthOf } from "@/lib/format";
import { quote, seatsLeft } from "@/lib/pricing";
import type { AmaiEvent } from "@/lib/types";

import { Chip } from "../ui/status";

export function eventAvailability(event: AmaiEvent) {
  if (event.status !== "open") return { label: "Closed", tone: "neutral" as const };
  const left = event.categories.map(seatsLeft);
  if (left.every((l) => l === 0)) return { label: "Sold out", tone: "danger" as const };
  const finite = left.filter((l): l is number => l !== null && l > 0);
  if (finite.length && Math.min(...finite) <= 10) return { label: "Few seats left", tone: "warning" as const };
  const early = event.categories.some((c) => quote(c).earlyBird);
  if (early) return { label: "Early bird", tone: "info" as const };
  return { label: "Open", tone: "success" as const };
}

export function EventCard({ event }: { event: AmaiEvent }) {
  const member = event.categories.find((c) => c.audience === "MEMBER");
  const nonMember = event.categories.find((c) => c.audience === "NON_MEMBER");
  const status = eventAvailability(event);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex overflow-hidden rounded-[var(--radius-card)] border border-line-200 bg-white shadow-[0_1px_2px_rgb(16_24_40/.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-blue-100 hover:shadow-md"
    >
      <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-brand-indigo-600 text-white sm:w-24">
        <span className="font-serif text-3xl leading-none font-bold">{dayOf(event.startsAt)}</span>
        <span className="mt-1 text-xs font-semibold tracking-widest">{monthOf(event.startsAt)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={status.tone}>{status.label}</Chip>
          <span className="text-xs text-ink-500">{formatDateRange(event.startsAt, event.endsAt)}</span>
        </div>
        <h3 className="font-sans text-lg leading-snug font-semibold text-ink-900 group-hover:text-brand-blue-600">
          {event.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
        </p>
        {(member || nonMember) && (
          <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {member && (
              <div className="flex gap-1.5">
                <dt className="text-ink-500">Member</dt>
                <dd className="tnum font-semibold text-ink-900">{formatINRShort(quote(member).taxablePaise)}</dd>
              </div>
            )}
            {nonMember && (
              <div className="flex gap-1.5">
                <dt className="text-ink-500">Non-member</dt>
                <dd className="tnum font-semibold text-ink-900">{formatINRShort(quote(nonMember).taxablePaise)}</dd>
              </div>
            )}
            <span className="text-xs self-center text-ink-500">+ GST</span>
          </dl>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-brand-blue-600">
          View & register <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
