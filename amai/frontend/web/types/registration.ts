import type { PaymentInfo } from "@/types/payment";

export type CategoryKey = "member" | "non-member" | "international";
export type Currency = "INR" | "USD";

export interface RegistrationCategory {
  key: CategoryKey;
  label: string;
  title: string;
  description: string;
  /** Base amount in whole rupees / dollars, for display only. The server is the source of truth for prices. */
  price: number;
  currency: Currency;
  /** 0.18 = 18% GST, 0 = none. */
  gstRate: number;
  tag?: string;
}

export interface RegistrationFormValues {
  name: string;
  company_name: string;
  mobile: string;
  email: string;
  delegates: string;
  message: string;
}

export type RegistrationErrors = Partial<Record<keyof RegistrationFormValues, string>>;

export interface RegistrationRequestPayload extends RegistrationFormValues {
  event: string;
  category: CategoryKey;
}

/** What the API returns after a registration request is accepted. */
export interface RegistrationReceipt {
  public_id: string;
  status: string;
  category: string;
  currency: Currency;
  quoted_base_minor: number;
  quoted_gst_minor: number;
  quoted_total_minor: number;
  /** Null when the registration is followed up manually instead of paid online. */
  payment: PaymentInfo | null;
}

export interface EnquiryPayload {
  name: string;
  company_name: string;
  mobile: string;
  email: string;
  message: string;
  /** Honeypot. Must stay empty. */
  website: string;
}
