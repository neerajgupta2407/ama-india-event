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

/** One delegate beyond the person registering. */
export interface AdditionalDelegate {
  name: string;
  email: string;
  phone: string;
  designation: string;
}

export type AdditionalDelegateErrors = Partial<Record<keyof AdditionalDelegate, string>>;

export interface RegistrationFormValues {
  name: string;
  company_name: string;
  /** The AMAI member organisation, asked of member delegates only. */
  membership: string;
  mobile: string;
  email: string;
  delegates: string;
  additional_delegates: AdditionalDelegate[];
}

export type RegistrationErrors = Partial<Record<Exclude<keyof RegistrationFormValues, "additional_delegates">, string>>;

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
