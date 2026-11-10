"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { SITE, URL_BUILDERS } from "@/config/urls";
import { useApi } from "@/hooks/useApi";
import type { OrderStatusResponse } from "@/types/payment";
import { readOrderToken } from "@/utils/orderToken";
import { formatMoney } from "@/utils/registration";
import { openCheckout } from "@/utils/razorpay";

const POLL_MS = 3000;
const MAX_POLLS = 20; // about 60 seconds

export default function PaymentStatus() {
  const reference = useSearchParams().get("ref") ?? "";
  // undefined on the server, then the token (or null) in the browser; avoids a hydration mismatch.
  const token = useSyncExternalStore(
    () => () => undefined,
    () => readOrderToken(reference),
    () => undefined,
  );
  const [status, setStatus] = useState<OrderStatusResponse | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [failedToLoad, setFailedToLoad] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const [run, setRun] = useState(0);

  const apiConfig = useMemo(
    () => ({ headers: (token ? { "X-Order-Token": token } : {}) as Record<string, string> }),
    [token],
  );
  const { get } = useApi(apiConfig);
  useEffect(() => {
    if (!token) return;
    let polls = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const next = await get<OrderStatusResponse>(URL_BUILDERS.orderStatus(reference));
        if (stopped) return;
        setStatus(next);
        setFailedToLoad(false);
        if (next.status !== "pending") return;
      } catch {
        if (stopped) return;
        setFailedToLoad(true);
      }
      polls += 1;
      if (polls >= MAX_POLLS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };
    tick();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [get, token, reference, run]);

  const recheck = useCallback(() => {
    setTimedOut(false);
    setRun((n) => n + 1);
  }, []);

  const retryPayment = useCallback(async () => {
    if (!status?.checkout) return;
    setCheckoutError(false);
    try {
      await openCheckout(status.checkout, {
        onSubmitted: recheck,
        onDismiss: () => undefined,
      });
    } catch {
      setCheckoutError(true);
    }
  }, [status, recheck]);

  const amount = status ? formatMoney(status.amount_minor / 100, status.currency) : "";

  return (
    <section className="ai_reg_top ai_bg_soft2 ai_sec">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <h1 className="ai_reg_h">Payment status</h1>

            {!reference && (
              <div className="alert alert-warning" role="alert">
                This payment link is incomplete. Contact {SITE.email} if you need help with your registration.
              </div>
            )}

            {reference && token === null && (
              <div className="alert alert-warning" role="alert">
                We can&apos;t show the status of this payment in this browser. If you completed the payment, the AMAI
                secretariat will confirm your registration. Contact {SITE.email} with order {reference}.
              </div>
            )}

            {reference && token && !status && !failedToLoad && (
              <div className="alert alert-info" role="status">
                Checking your payment…
              </div>
            )}

            {token && !status && failedToLoad && (
              <div className="alert alert-danger" role="alert">
                We could not check your payment just now. Please try again in a moment.
                <div className="mt-2">
                  <button className="ai_btn" type="button" onClick={recheck}>
                    Check again
                  </button>
                </div>
              </div>
            )}

            {status?.status === "pending" && (
              <div className="alert alert-info" role="status">
                <b>Processing your payment of {amount}.</b> Please keep this page open; this usually takes a few
                seconds.
                {timedOut && (
                  <div className="mt-2">
                    We have not received confirmation yet. If you completed the payment, the secretariat will confirm
                    your registration {status.registration}.{" "}
                    <button className="ai_btn ms-2" type="button" onClick={recheck}>
                      Check again
                    </button>
                    {status.checkout && (
                      <div className="mt-3">
                        Closed the payment window before paying?{" "}
                        <button className="ai_btn ms-2" type="button" onClick={retryPayment}>
                          Open payment window
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {status?.status === "paid" && (
              <div className="alert alert-success" role="status">
                <b>Payment received. Your registration is confirmed.</b>
                <div className="mt-2">
                  Registration <b>{status.registration}</b> · Order {status.reference} · {amount}
                </div>
              </div>
            )}

            {status?.status === "failed" && (
              <div className="alert alert-danger" role="alert">
                <b>The payment did not go through.</b> No money has been taken for this attempt. You can try again.
                <div className="mt-2">
                  <button className="ai_btn" type="button" onClick={retryPayment}>
                    Pay {amount}
                  </button>
                </div>
                {checkoutError && <div className="mt-2">Payment could not be opened. Please try again.</div>}
              </div>
            )}

            {status?.status === "mismatch" && (
              <div className="alert alert-warning" role="alert">
                <b>We need to check this payment.</b> The amount received did not match your order. The AMAI secretariat
                has been alerted; please contact {SITE.email} with order {status.reference}.
              </div>
            )}

            <Link className="ai_reg_back" href="/">
              <i aria-hidden="true" className="bi bi-chevron-left"></i> Back to the conference page
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
