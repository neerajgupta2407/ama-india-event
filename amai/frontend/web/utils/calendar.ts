import type { PassResponse } from "@/types/pass";

/** 2027-01-28T00:00+05:30 -> "20270128", the calendar day in India (events are in IST). */
function istDay(iso: string, addDays = 0): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + addDays);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
  return parts.replaceAll("-", "");
}

/** Escapes text for an .ics file: backslash, semicolon, comma and line breaks. */
function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** An all-day calendar entry for the whole event. DTEND is exclusive, so it is the day after the last day. */
export function buildEventCalendar(pass: PassResponse, now: Date = new Date()): string {
  const { event } = pass;
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const location = [event.venue, event.city].filter(Boolean).join(", ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AMAI//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${pass.public_id}@amaindiaevents.org`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${istDay(event.starts_at)}`,
    `DTEND;VALUE=DATE:${istDay(event.ends_at, 1)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(location)}`,
    `DESCRIPTION:${escapeText(`Registration ${pass.public_id}. Show your entry pass QR code at the registration desk.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
