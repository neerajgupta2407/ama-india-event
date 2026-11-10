import { ApiError } from "@/hooks/useApi";
import type { Currency } from "@/types/registration";
import type { StaffRole, StaffUser } from "@/types/staff";

const SYMBOL: Record<Currency, string> = { INR: "₹", USD: "$" };

/** 1234500, "INR" -> "₹12,345.00". Amounts from the API are always whole minor units. */
export function formatMinor(minor: number | null | undefined, currency: Currency): string {
  if (minor === null || minor === undefined) return "—";
  const locale = currency === "USD" ? "en-US" : "en-IN";
  return `${SYMBOL[currency]}${(minor / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
}

export function hasRole(user: StaffUser | null, ...roles: StaffRole[]): boolean {
  if (!user) return false;
  return user.is_superuser || roles.some((role) => user.roles.includes(role));
}

/** "?a=1&b=2" from the filters that are actually set. */
export function queryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== null && value !== undefined && value !== false) search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** A signed-out session shows as 401, or as 403 with Django's "credentials were not provided". */
export function isSignedOut(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 401) return true;
  const detail = (error.data as { detail?: string } | null)?.detail ?? "";
  return error.status === 403 && /credentials/i.test(detail);
}

/** A sentence for the screen from whatever the API sent back. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data as Record<string, unknown> | string[] | null;
    if (data && !Array.isArray(data)) {
      if (typeof data.detail === "string") return data.detail;
      const first = Object.entries(data)[0];
      if (first) {
        const [field, value] = first;
        const text = Array.isArray(value) ? String(value[0]) : String(value);
        return field === "non_field_errors" ? text : `${field.replace(/_/g, " ")}: ${text}`;
      }
    }
    if (error.status === 403) return "You do not have permission to do this.";
    if (error.status === 429) return "Too many attempts. Please wait a while and try again.";
    if (error.status >= 500) return "The server had a problem. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

/** Browsers cannot save a fetched file directly, so route it through a temporary link. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  not_required: "Not needed",
  pending_review: "Needs review",
  verified: "Verified",
  rejected: "Rejected",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  mismatch: "Mismatch",
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
  open: "Open",
  draft: "Draft",
  archived: "Archived",
};

/** Bootstrap colour for a status badge. */
export const STATUS_TONE: Record<string, string> = {
  confirmed: "success",
  paid: "success",
  verified: "success",
  open: "success",
  pending_payment: "warning",
  pending: "warning",
  pending_review: "warning",
  contacted: "info",
  requested: "secondary",
  new: "primary",
  failed: "danger",
  mismatch: "danger",
  rejected: "danger",
  cancelled: "dark",
  closed: "dark",
  archived: "dark",
  draft: "secondary",
  not_required: "light",
};
