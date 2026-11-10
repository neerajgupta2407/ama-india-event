import type { CategoryKey, Currency, RegistrationCategory } from "@/types/registration";

export const CATEGORIES: Record<CategoryKey, RegistrationCategory> = {
  member: {
    key: "member",
    label: "Member delegate",
    title: "Member Delegate",
    description: "Employees of AMAI member companies. We verify your membership during registration.",
    price: 30000,
    currency: "INR",
    gstRate: 0.18,
    tag: "Membership check",
  },
  "non-member": {
    key: "non-member",
    label: "Non-member delegate",
    title: "Non-Member Delegate",
    description: "Indian participants from non-member organisations.",
    price: 35000,
    currency: "INR",
    gstRate: 0.18,
  },
  international: {
    key: "international",
    label: "International delegates",
    title: "International Delegates",
    description: "Participants from outside India. No GST applies.",
    price: 900,
    currency: "USD",
    gstRate: 0,
  },
};

export const DELEGATE_OPTIONS = ["1", "2", "3", "4", "5 or more"] as const;

export function isCategoryKey(value: string): value is CategoryKey {
  return value in CATEGORIES;
}

export function formatMoney(amount: number, currency: Currency): string {
  const locale = currency === "USD" ? "en-US" : "en-IN";
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function priceBreakdown(category: RegistrationCategory) {
  const gst = category.price * category.gstRate;
  return { base: category.price, gst, total: category.price + gst };
}
