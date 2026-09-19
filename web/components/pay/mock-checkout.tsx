"use client";

import clsx from "clsx";
import { AlertTriangle, Building2, CheckCircle2, CreditCard, Lock, Smartphone, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/primitives";
import { formatINR } from "@/lib/format";
import { getByOrderRef, simulateGateway, type GatewayOutcome } from "@/lib/mock/api";
import { getEvent } from "@/lib/mock/data";
import type { PaymentAttempt, Registration } from "@/lib/types";

const METHODS: { id: PaymentAttempt["method"]; label: string; Icon: typeof CreditCard }[] = [
  { id: "upi", label: "UPI", Icon: Smartphone },
  { id: "card", label: "Card", Icon: CreditCard },
  { id: "netbanking", label: "Net banking", Icon: Building2 },
];

export function MockCheckout({ orderRef }: { orderRef: string }) {
  const router = useRouter();
  const [reg, setReg] = useState<Registration | null | undefined>(undefined);
  const [method, setMethod] = useState<PaymentAttempt["method"]>("upi");
  const [busy, setBusy] = useState<GatewayOutcome | null>(null);

  useEffect(() => {
    getByOrderRef(orderRef).then((r) => {
      if (r?.order.status === "PAID") router.replace(`/pay/${orderRef}`);
      else setReg(r);
    });
  }, [orderRef, router]);

  async function go(outcome: GatewayOutcome) {
    setBusy(outcome);
    await simulateGateway(orderRef, outcome, method);
    router.replace(`/pay/${orderRef}`);
  }

  if (reg === undefined) return <Spinner className="size-8 text-white" />;
  if (reg === null)
    return <p className="rounded-lg bg-white p-6 text-ink-700">Order {orderRef} not found in this browser.</p>;

  const event = getEvent(reg.eventSlug);
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-[#2b3445] px-5 py-4 text-white">
        <div>
          <p className="text-xs tracking-wider uppercase opacity-70">Paying</p>
          <p className="font-semibold">Alkali Manufacturers Association of India</p>
        </div>
        <button
          type="button"
          aria-label="Close checkout"
          onClick={() => go("CANCELLED")}
          className="rounded-md p-1.5 hover:bg-white/10"
          disabled={!!busy}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="border-b border-line-200 px-5 py-4">
        <p className="text-sm text-ink-500">{event?.title}</p>
        <p className="tnum mt-1 text-3xl font-semibold text-ink-900">{formatINR(reg.order.amountPaise)}</p>
        <p className="mt-1 font-mono text-xs text-ink-500">Order {reg.order.reference}</p>
      </div>

      <div className="px-5 py-4">
        <p className="mb-2 text-sm font-medium text-ink-900">Payment method</p>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMethod(id)}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium",
                method === id ? "border-[#2b3445] bg-[#f1f3f7] text-ink-900" : "border-line-200 text-ink-500",
              )}
            >
              <Icon className="size-5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 bg-surface-100 px-5 py-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-warning uppercase">
          <AlertTriangle className="size-3.5" /> Test mode: choose an outcome
        </p>
        <OutcomeButton onClick={() => go("PAID")} busy={busy === "PAID"} disabled={!!busy} className="bg-success text-white hover:bg-[#116a33]">
          <CheckCircle2 className="size-4" /> Payment succeeds
        </OutcomeButton>
        <OutcomeButton onClick={() => go("FAILED")} busy={busy === "FAILED"} disabled={!!busy} className="bg-white text-danger ring-1 ring-danger/40 hover:bg-danger-bg">
          <XCircle className="size-4" /> Bank declines payment
        </OutcomeButton>
        <OutcomeButton onClick={() => go("MISMATCH")} busy={busy === "MISMATCH"} disabled={!!busy} className="bg-white text-ink-700 ring-1 ring-line-200 hover:bg-white/60">
          <AlertTriangle className="size-4" /> Webhook amount mismatch
        </OutcomeButton>
        <OutcomeButton onClick={() => go("CANCELLED")} busy={busy === "CANCELLED"} disabled={!!busy} className="bg-transparent text-ink-500 hover:text-ink-900">
          Cancel and go back
        </OutcomeButton>
      </div>
      <p className="flex items-center justify-center gap-1.5 py-3 text-xs text-ink-500">
        <Lock className="size-3.5" /> Mock gateway. Card and UPI details are never collected here.
      </p>
    </div>
  );
}

function OutcomeButton({
  children,
  busy,
  className,
  ...rest
}: React.ComponentProps<"button"> & { busy?: boolean }) {
  return (
    <button
      type="button"
      className={clsx(
        "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60",
        className,
      )}
      {...rest}
    >
      {busy ? <Spinner /> : children}
    </button>
  );
}
