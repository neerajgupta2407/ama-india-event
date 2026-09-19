// Shapes mirror the Django models in ../IMPLEMENTATION.md §4 so the mock layer can be swapped for the real API.

export type Audience = "MEMBER" | "NON_MEMBER" | "STUDENT";

export type TicketCategory = {
  id: string;
  code: string;
  name: string;
  audience: Audience;
  description: string;
  baseAmountPaise: number;
  earlyBirdAmountPaise?: number;
  earlyBirdUntil?: string;
  gstRate: number;
  capacity: number | null;
  seatsTaken: number;
  requiresMemberValidation: boolean;
};

export type AgendaItem = { time: string; title: string; speaker?: string };
export type Speaker = { name: string; role: string; org: string };

export type EventStatus = "draft" | "open" | "closed" | "archived";

export type AmaiEvent = {
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  city: string;
  status: EventStatus;
  registrationPrefix: string;
  registrationClosesAt: string;
  categories: TicketCategory[];
  agenda: AgendaItem[];
  speakers: Speaker[];
  highlights: string[];
};

export type MemberValidation = "NOT_REQUIRED" | "VERIFIED" | "PENDING_REVIEW" | "REJECTED";

export type RegistrationStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "REFUNDED";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "MISMATCH"
  | "REFUNDED";

export type PaymentAttempt = {
  id: string;
  method: "card" | "upi" | "netbanking";
  status: "captured" | "failed" | "cancelled";
  at: string;
  providerPaymentId: string;
  error?: string;
};

export type MessageLog = {
  id: string;
  channel: "email" | "sms";
  template: string;
  to: string;
  status: "QUEUED" | "ACCEPTED" | "DELIVERED" | "FAILED" | "BOUNCED";
  at: string;
};

export type AuditEvent = { at: string; actor: string; action: string };

export type Quote = {
  taxablePaise: number;
  gstPaise: number;
  totalPaise: number;
  gstRate: number;
  earlyBird: boolean;
};

export type Registration = {
  publicId: string;
  eventSlug: string;
  categoryId: string;
  claimedAudience: Audience;
  memberValidation: MemberValidation;
  memberIdentifier?: string;
  status: RegistrationStatus;
  createdAt: string;
  person: {
    fullName: string;
    email: string;
    mobile: string;
    organisation: string;
    designation: string;
    city: string;
    state: string;
  };
  billing: { gstin?: string; billingName: string; state: string };
  consentMarketing: boolean;
  utmSource?: string;
  order: {
    reference: string;
    amountPaise: number;
    quote: Quote;
    status: OrderStatus;
    paidAt?: string;
    attempts: PaymentAttempt[];
    // Mock-only: simulated gateway webhook that lands at resolveAt.
    pendingOutcome?: { outcome: "PAID" | "FAILED" | "MISMATCH"; resolveAt: number; method: PaymentAttempt["method"] };
  };
  pass?: { token: string; checkedInAt?: string; checkedInBy?: string };
  messages: MessageLog[];
  audit: AuditEvent[];
};

export type NewsItem = { date: string; title: string; href: string; kind?: "pdf" | "link" };
export type Publication = { title: string; issue: string; kind: string; cover: "blue" | "indigo" | "amber" };
