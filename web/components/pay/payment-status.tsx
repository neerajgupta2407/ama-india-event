"use client";

import clsx from "clsx";
import { CalendarPlus, FileDown, Mail, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button, ButtonLink, Card, Spinner } from "@/components/ui/primitives";
import { ORDER_STATUS } from "@/components/ui/status";
import { formatDateTime, formatINR } from "@/lib/format";
import { getOrderStatus, resendConfirmation, retryPayment } from "@/lib/mock/api";
import { getEvent } from "@/lib/mock/data";
import type { OrderStatus, Registration } from "@/lib/types";

import { AttendeePass, downloadIcs } from "./attendee-pass";

const POLL_MS = 2000;
const POLL_LIMIT_MS = 60_000;

const iconTone: Record<OrderStatus, string> = {
  PENDING: "bg-warning-bg text-warning",
  PROCESSING: "bg-warning-bg text-warning",
  PAID: "bg-success-bg text-success",
  FAILED: "bg-danger-bg text-danger",
  CANCELLED: "bg-surface-100 text-ink-500",
  MISMATCH: "bg-danger-bg text-danger",
  REFUNDED: "bg-brand-blue-50 text-brand-blue-600",
};

export function PaymentStatus({ orderRef }: { orderRef: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ status: OrderStatus; registration: Registration } | null | undefined>();
  const [timedOut, setTimedOut] = useState(false);
  const [resent, setResent] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const started = useRef(0);

  useEffect(() => {
    let alive = true;
    started.current = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const s = await getOrderStatus(orderRef);
      if (!alive) return;
      setState(s);
      const inFlight = s?.status === "PROCESSING";
      if (inFlight && Date.now() - started.current < POLL_LIMIT_MS) timer = setTimeout(tick, POLL_MS);
      else if (inFlight) setTimedOut(true);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [orderRef]);

  if (state === undefined)
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8 text-brand-blue-600" />
      </div>
    );
  if (state === null)
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold text-ink-900">We couldn’t find order {orderRef}.</p>
        <p className="mt-2 text-sm text-ink-500">Demo orders live in this browser only.</p>
      </Card>
    );

  const { status, registration: reg } = state;
  // A PENDING order with no attempts means the visitor came back without opening checkout.
  const notStarted = status === "PENDING" && reg.order.attempts.length === 0;
  const meta = ORDER_STATUS[status];
  const event = getEvent(reg.eventSlug)!;
  const Icon = meta.icon;

  const body: Record<OrderStatus, string> = {
    PROCESSING: timedOut
      ? "This is taking longer than usual. You don’t need to pay again. We’ll email you as soon as the bank confirms."
      : "Please don’t close this page or press back. This usually takes a few seconds.",
    PENDING: "Your registration is saved, but payment hasn’t been completed yet.",
    PAID: `You’re registered for ${event.title}. We’ve emailed your pass and GST invoice to ${reg.person.email}.`,
    FAILED: "Your bank didn’t approve the payment. No money was taken. If it was, it will be refunded automatically.",
    CANCELLED: "You closed the payment window. Your registration is saved, so you can try again.",
    MISMATCH: "We received a payment that didn’t match this order. The AMAI finance team has been alerted and will contact you within one working day.",
    REFUNDED: "Your refund has been processed. It usually reaches your account in 5–7 working days.",
  };

  async function retry() {
    setRetrying(true);
    await retryPayment(orderRef);
    router.push(`/gateway/${orderRef}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div aria-live="polite" className="text-center">
        <span className={clsx("mx-auto flex size-16 items-center justify-center rounded-full", iconTone[status])}>
          <Icon className={clsx("size-8", status === "PROCESSING" && "animate-spin")} aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-bold sm:text-4xl">{notStarted ? "Complete your payment" : meta.visitor}</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-500">{body[status]}</p>
      </div>

      {status === "PAID" && reg.pass && (
        <div className="mt-10 grid items-start gap-8 md:grid-cols-[1fr_1fr]">
          <AttendeePass reg={reg} />
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">Next steps</h2>
              <div className="mt-4 grid gap-2">
                <Button variant="secondary" onClick={() => downloadIcs(reg)}>
                  <CalendarPlus className="size-4" /> Add to calendar
                </Button>
                <Button variant="secondary" disabled title="Generated by the backend">
                  <FileDown className="size-4" /> Download GST invoice
                </Button>
                <Button
                  variant="tertiary"
                  disabled={resent}
                  onClick={async () => {
                    await resendConfirmation(reg.publicId, "visitor");
                    setResent(true);
                  }}
                >
                  <Mail className="size-4" /> {resent ? "Sent again" : "Email me the pass again"}
                </Button>
              </div>
            </Card>
            <Receipt reg={reg} />
          </div>
        </div>
      )}

      {status !== "PAID" && (
        <div className="mx-auto mt-8 max-w-md">
          <Receipt reg={reg} />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {(status === "FAILED" || status === "CANCELLED") && (
              <Button size="lg" onClick={retry} loading={retrying}>
                <RotateCcw className="size-4" /> Try payment again
              </Button>
            )}
            {notStarted && <ButtonLink href={`/gateway/${orderRef}`} size="lg">Continue to payment</ButtonLink>}
            {status === "PROCESSING" && !timedOut && (
              <p className="flex items-center justify-center gap-2 text-sm text-ink-500">
                <Spinner /> Checking with the payment gateway…
              </p>
            )}
            <ButtonLink href={`/events/${event.slug}`} variant="tertiary" size="lg">
              Back to event
            </ButtonLink>
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-sm text-ink-500">
        Questions? Write to <a href="mailto:info@ama-india.org" className="text-brand-blue-600 underline">info@ama-india.org</a>{" "}
        quoting <span className="font-mono">{reg.publicId}</span>.{" "}
        <Link href="/dashboard/registrations" className="text-ink-400 underline">
          (See it in the staff dashboard)
        </Link>
      </p>
    </div>
  );
}

function Receipt({ reg }: { reg: Registration }) {
  const rows: [string, string][] = [
    ["Registration ID", reg.publicId],
    ["Order", reg.order.reference],
    ["Amount", formatINR(reg.order.amountPaise)],
    ["Updated", formatDateTime(reg.order.paidAt ?? reg.order.attempts.at(-1)?.at ?? reg.createdAt)],
  ];
  return (
    <Card className="p-5">
      <dl className="space-y-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-ink-500">{k}</dt>
            <dd className={clsx("text-right text-ink-900", k !== "Updated" && "font-mono")}>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
