/** All backend URLs live here. Never hardcode an API path in a component. */
// Local dev calls the API directly. Deployed builds call /api on the same origin,
// which next.config.ts proxies to API_ORIGIN.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export const URLS = {
  API_BASE_URL,
  HEALTH: "/healthz/",
  ENQUIRIES: "/api/enquiries/",
  REGISTRATION_REQUESTS: "/api/registrations/requests/",
  REGISTRATION_QUOTE: "/api/registrations/quote/",
} as const;

export const SITE = {
  email: "hkanand@ama-india.org",
  /** WhatsApp Business number used by the "Send on WhatsApp" fallback. */
  whatsappNumber: "919818904989",
  /** Slug of the event in the API (created by `manage.py seed_conference_2027`). */
  eventSlug: "alkali-industry-conference-2027",
  conferenceName: "12th AMAI Alkali Industry Conference",
  conferenceDates: "28-29 Jan 2027",
  /** IST midnight on day one. */
  conferenceStart: "2027-01-28T00:00:00+05:30",
} as const;

export const URL_BUILDERS = {
  orderStatus: (reference: string) => `/api/orders/${encodeURIComponent(reference)}/status/`,
  whatsapp: (message: string) => `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`,
};
