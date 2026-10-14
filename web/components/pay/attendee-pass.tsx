"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { formatDateRange, formatDateTime } from "@/lib/format";
import { getEvent } from "@/lib/mock/data";
import type { Registration } from "@/lib/types";

export const passUrl = (token: string) =>
  `${typeof window === "undefined" ? "https://ama-india.org" : window.location.origin}/c/${token}`;

export function AttendeePass({ reg }: { reg: Registration }) {
  const event = getEvent(reg.eventSlug)!;
  const category = event.categories.find((c) => c.id === reg.categoryId);
  const token = reg.pass!.token;
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line-200 bg-white shadow-lg">
      <div className="bg-brand-indigo-600 px-6 py-5 text-white">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-80">AMAI event pass</p>
        <p className="mt-1 text-xl leading-snug font-extrabold">{event.title}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm opacity-90">
          <MapPin className="size-4" aria-hidden /> {formatDateRange(event.startsAt, event.endsAt)} · {event.city}
        </p>
      </div>
      <div className="relative">
        <div className="absolute -top-3 -left-3 size-6 rounded-full bg-surface-100" aria-hidden />
        <div className="absolute -top-3 -right-3 size-6 rounded-full bg-surface-100" aria-hidden />
      </div>
      <div className="flex flex-col items-center px-6 pt-6 pb-4">
        {/* Black on white, EC level M, 4-module quiet zone (DESIGN_SYSTEM.md §6) */}
        <QRCodeSVG value={passUrl(token)} size={208} level="M" marginSize={4} aria-label="Check-in QR code" />
        <p className="mt-2 font-mono text-sm tracking-wide text-ink-900">{reg.publicId}</p>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-line-200 px-6 py-5 text-sm">
        <div className="col-span-2">
          <dt className="text-ink-500">Attendee</dt>
          <dd className="text-lg font-semibold text-ink-900">{reg.person.fullName}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Organisation</dt>
          <dd className="font-medium text-ink-900">{reg.person.organisation}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Category</dt>
          <dd className="font-medium text-ink-900">{category?.name}</dd>
        </div>
      </dl>
      {reg.pass?.checkedInAt && (
        <p className="flex items-center justify-center gap-2 bg-success-bg px-6 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" /> Checked in {formatDateTime(reg.pass.checkedInAt)}
        </p>
      )}
    </div>
  );
}

export function downloadIcs(reg: Registration) {
  const event = getEvent(reg.eventSlug)!;
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AMAI//Events//EN",
    "BEGIN:VEVENT",
    `UID:${reg.publicId}@ama-india.org`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(event.startsAt)}`,
    `DTEND:${fmt(event.endsAt)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.venue}\\, ${event.city}`,
    `DESCRIPTION:Registration ${reg.publicId}. Show your QR pass at the venue.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${event.slug}.ics` });
  a.click();
  URL.revokeObjectURL(url);
}

