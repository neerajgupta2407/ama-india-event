import type { Currency } from "@/types/registration";

/** What the browser needs to open Razorpay Checkout. Comes from the API, never contains a secret. */
export interface CheckoutParams {
  key: string;
  order_id: string;
  amount: number;
  currency: Currency;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

export interface PaymentInfo {
  order_ref: string;
  access_token: string;
  amount_minor: number;
  currency: Currency;
  checkout: CheckoutParams;
}

export type OrderState = "pending" | "paid" | "failed" | "mismatch";

export interface OrderStatusResponse {
  reference: string;
  status: OrderState;
  registration: string;
  amount_minor: number;
  currency: Currency;
  paid_at: string | null;
  /** Present while the order can still be paid, so a failed payment can be retried. */
  checkout?: CheckoutParams;
}

/** The server's exact price for this many delegates. Present fields depend on `payable_online`. */
export interface QuoteResponse {
  payable_online: boolean;
  currency: Currency;
  delegates?: number;
  unit_minor?: number;
  subtotal_minor?: number;
  discount_percent?: string;
  discount_minor?: number;
  gst_rate?: string;
  gst_minor?: number;
  total_minor?: number;
}
