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
  // Staff dashboard
  STAFF_CSRF: "/api/staff/auth/csrf/",
  STAFF_LOGIN: "/api/staff/auth/login/",
  STAFF_LOGOUT: "/api/staff/auth/logout/",
  STAFF_ME: "/api/staff/auth/me/",
  STAFF_OVERVIEW: "/api/staff/overview/",
  STAFF_REGISTRATIONS: "/api/staff/registrations/",
  STAFF_REGISTRATIONS_EXPORT: "/api/staff/registrations/export/",
  STAFF_ORDERS: "/api/staff/orders/",
  STAFF_RECONCILIATION: "/api/staff/reconciliation/",
  STAFF_RECONCILIATION_RUN: "/api/staff/reconciliation/run/",
  STAFF_CHECKIN: "/api/staff/checkin/",
  STAFF_CHECKIN_SEARCH: "/api/staff/checkin/search/",
  STAFF_CHECKIN_RECENT: "/api/staff/checkin/recent/",
  STAFF_ENQUIRIES: "/api/staff/enquiries/",
  STAFF_EVENTS: "/api/staff/events/",
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
  staffRegistration: (publicId: string) => `/api/staff/registrations/${encodeURIComponent(publicId)}/`,
  staffRegistrationAction: (publicId: string, action: string) =>
    `/api/staff/registrations/${encodeURIComponent(publicId)}/${action}/`,
  staffEnquiryStatus: (id: string) => `/api/staff/enquiries/${encodeURIComponent(id)}/status/`,
  staffEventSettings: (slug: string) => `/api/staff/events/${encodeURIComponent(slug)}/settings/`,
  staffCategory: (id: string) => `/api/staff/ticket-categories/${encodeURIComponent(id)}/`,
  orderStatus: (reference: string) => `/api/orders/${encodeURIComponent(reference)}/status/`,
  whatsapp: (message: string) => `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`,
};
