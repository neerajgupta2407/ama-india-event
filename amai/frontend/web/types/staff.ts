import type { AdditionalDelegate, Currency } from "@/types/registration";

export type StaffRole = "ops" | "finance" | "membership" | "event_admin" | "checkin_operator" | "viewer";

export interface StaffUser {
  email: string;
  name: string;
  is_superuser: boolean;
  roles: StaffRole[];
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type RegistrationState = "requested" | "pending_payment" | "confirmed" | "cancelled";
export type MemberState = "not_required" | "pending_review" | "verified" | "rejected";
export type OrderState = "pending" | "paid" | "failed" | "mismatch";

export interface RevenueRow {
  currency: Currency;
  orders: number;
  taxable_minor: number;
  gst_minor: number;
  total_minor: number;
}

export interface AttentionItem {
  kind: "payment_mismatch" | "payment_failed" | "payment_stale" | "member_review";
  severity: "urgent" | "review" | "follow_up";
  detail: string;
  registration: string;
  name: string;
  company: string;
  at: string;
}

export interface Overview {
  registrations: { total: number; requested: number; pending_payment: number; confirmed: number; cancelled: number };
  payments: { paid: number; pending: number; failed: number; mismatch: number; revenue: RevenueRow[] };
  member_reviews_pending: number;
  enquiries_new: number;
  check_in: { admitted: number; expected: number };
  by_category: { code: string; name: string; total: number; confirmed: number }[];
  attention: AttentionItem[];
  events: { slug: string; title: string }[];
}

export interface RegistrationRow {
  id: string;
  public_id: string;
  event: string;
  category: string;
  category_name: string;
  status: RegistrationState;
  member_validation: MemberState;
  full_name: string;
  company_name: string;
  membership: string;
  mobile: string;
  email: string;
  delegates: string;
  message: string;
  additional_delegates: AdditionalDelegate[];
  currency: Currency;
  quoted_base_minor: number;
  quoted_gst_minor: number;
  quoted_total_minor: number;
  payment_status: OrderState | null;
  order_reference: string | null;
  order_amount_minor: number | null;
  created_at: string;
}

export interface PaymentAttemptRow {
  provider_payment_id: string;
  method: string;
  status: "created" | "authorized" | "captured" | "failed";
  amount_minor: number;
  currency: Currency;
  error_code: string;
  error_description: string;
  created_at: string;
}

export interface StaffOrder {
  reference: string;
  status: OrderState;
  amount_minor: number;
  currency: Currency;
  tax_breakup: {
    subtotal_minor?: number;
    discount_percent?: string;
    discount_minor?: number;
    gst_minor?: number;
    delegates?: number;
  };
  paid_at: string | null;
  created_at: string;
  attempts: PaymentAttemptRow[];
}

export interface AuditRow {
  action: string;
  actor: string;
  at: string;
  data: Record<string, unknown>;
}

export interface RegistrationDetail extends RegistrationRow {
  orders: StaffOrder[];
  attendee_pass: { admits: number; issued_at: string; revoked_at: string | null; admitted: number } | null;
  audit: AuditRow[];
}

export interface OrderRow {
  reference: string;
  status: OrderState;
  amount_minor: number;
  currency: Currency;
  registration: string;
  name: string;
  company: string;
  email: string;
  event: string;
  attempts: number;
  last_error: string;
  created_at: string;
  paid_at: string | null;
}

export interface ReconciliationException {
  order: string;
  registration: string;
  issue: "mismatch" | "paid_not_captured" | "duplicate_capture" | "stale_pending" | "provider_unreachable";
  detail: string;
}

export interface ReconciliationRun {
  id: string;
  created_at: string;
  finished_at: string | null;
  triggered_by_label: string;
  event_slug: string;
  orders_checked: number;
  matched: number;
  recovered: number;
  exceptions: ReconciliationException[];
}

export type CheckInResultCode = "OK" | "ALREADY_CHECKED_IN" | "NOT_PAID" | "REVOKED" | "INVALID";

export interface GateRegistration {
  public_id: string;
  name: string;
  company: string;
  category: string;
  delegates: string;
}

export interface CheckInOutcome {
  result: CheckInResultCode;
  registration: GateRegistration | null;
  admitted: number;
  admits: number;
  last_checked_in_at: string | null;
}

export interface CheckInSearchRow extends GateRegistration {
  admits: number | null;
  admitted: number;
}

export interface RecentCheckIn {
  id: string;
  registration: GateRegistration;
  checked_in_at: string;
  operator_label: string;
  gate: string;
}

export interface EnquiryRow {
  id: string;
  name: string;
  company_name: string;
  mobile: string;
  email: string;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export interface StaffCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  audience: string;
  currency: Currency;
  base_amount_minor: number;
  gst_rate: string;
  requires_member_validation: boolean;
  display_order: number;
  is_active: boolean;
}

export interface StaffEvent {
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue: string;
  city: string;
  status: "draft" | "open" | "closed" | "archived";
  registration_prefix: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  online_payment_enabled: boolean;
  early_bird_percent: string;
  early_bird_until: string | null;
  group_discount_percent: string;
  group_min_delegates: number;
  registrations: number;
  categories: StaffCategory[];
}
