import type { CheckoutParams } from "@/types/payment";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayOptions extends CheckoutParams {
  theme: { color: string };
  handler: () => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

/** Loads Razorpay's script on demand, so it only runs on the payment step. */
export function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error("Could not load Razorpay Checkout"));
      };
      document.body.appendChild(script);
    });
  }
  return loading;
}

interface CheckoutHandlers {
  /** The visitor finished paying in the modal. Not proof of payment: the server confirms it. */
  onSubmitted: () => void;
  onDismiss: () => void;
}

export async function openCheckout(params: CheckoutParams, handlers: CheckoutHandlers): Promise<void> {
  await loadCheckoutScript();
  if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable");
  new window.Razorpay({
    ...params,
    theme: { color: "#0E8F8A" },
    handler: handlers.onSubmitted,
    modal: { ondismiss: handlers.onDismiss },
  }).open();
}
