import { z } from "zod";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Other / Outside India",
];

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// UX-only validation; the DRF serializer re-validates everything (IMPLEMENTATION.md §10).
export const detailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name as it should appear on the badge"),
  email: z.email("Enter a valid email address"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  organisation: z.string().trim().min(2, "Enter your organisation"),
  designation: z.string().trim().min(2, "Enter your designation"),
  city: z.string().trim().min(2, "Enter your city"),
  state: z.string().min(1, "Select your state"),
  billingName: z.string().trim().min(2, "Enter the name for the GST invoice"),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || GSTIN.test(v), "GSTIN should look like 27AAACT1234F1Z5"),
  consentTransactional: z.literal(true, { error: "Required to send your confirmation and pass" }),
  consentMarketing: z.boolean(),
});

export type Details = z.infer<typeof detailsSchema>;
