"use client";

import { useState } from "react";

import { Drawer, Money, Notice, ReasonDialog, Spinner, StatusBadge } from "@/components/admin/ui";
import { URL_BUILDERS } from "@/config/urls";
import { useStaff } from "@/contexts/StaffContext";
import { useApi } from "@/hooks/useApi";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import type { RegistrationDetail } from "@/types/staff";
import { errorMessage, formatDateTime, hasRole } from "@/utils/staff";

type Tab = "details" | "payment" | "activity";
type Dialog = "confirm" | "cancel" | null;

const ACTION_LABEL: Record<string, string> = {
  "registration.member_review": "Membership reviewed",
  "payment.refresh": "Payment status checked",
  "registration.resend": "Confirmation resent",
  "registration.confirm_manually": "Confirmed by hand",
  "registration.cancel": "Cancelled",
};

function describe(data: Record<string, unknown>): string {
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${key.replace(/_/g, " ")}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`,
    )
    .join(" · ");
}

export default function RegistrationDrawer({
  publicId,
  onClose,
  onChanged,
}: {
  publicId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user } = useStaff();
  const { post } = useApi();
  const { data, error, loading, refetch } = useStaffQuery<RegistrationDetail>(URL_BUILDERS.staffRegistration(publicId));
  const [tab, setTab] = useState<Tab>("details");
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "danger"; text: string } | null>(null);
  const [admits, setAdmits] = useState("");

  async function run(key: string, action: string, body?: unknown, success?: string) {
    setBusy(key);
    setNotice(null);
    setDialogError(null);
    try {
      await post<RegistrationDetail>(URL_BUILDERS.staffRegistrationAction(publicId, action), body);
      setNotice({ kind: "success", text: success ?? "Done." });
      setDialog(null);
      refetch();
      onChanged();
    } catch (caught) {
      const message = errorMessage(caught);
      if (dialog) setDialogError(message);
      else setNotice({ kind: "danger", text: message });
    } finally {
      setBusy(null);
    }
  }

  const title = data ? data.full_name : publicId;
  const paidOnline = data?.orders.some((o) => o.status === "paid") ?? false;
  const hasOpenOrder = data?.orders.some((o) => o.status === "pending" || o.status === "failed") ?? false;
  const canConfirmByHand = !!data && (data.status === "requested" || data.status === "pending_payment") && !paidOnline;

  return (
    <Drawer title={title} subtitle={publicId} onClose={onClose}>
      {error && <Notice kind="danger">{error}</Notice>}
      {!data && loading && <Spinner />}
      {data && (
        <>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <StatusBadge value={data.status} />
            {data.member_validation !== "not_required" && <StatusBadge value={data.member_validation} />}
            {data.payment_status && <StatusBadge value={data.payment_status} />}
          </div>
          {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

          <div className="d-flex flex-wrap gap-2 mb-4">
            {data.member_validation === "pending_review" && hasRole(user, "membership", "ops") && (
              <>
                <button
                  className="btn btn-sm btn-adm"
                  disabled={!!busy}
                  onClick={() => run("verify", "member-review", { decision: "verified" }, "Membership verified.")}
                >
                  Verify membership
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={!!busy}
                  onClick={() => run("reject", "member-review", { decision: "rejected" }, "Membership rejected.")}
                >
                  Reject
                </button>
              </>
            )}
            {data.orders.length > 0 && (
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={!!busy || !hasOpenOrder}
                title={hasOpenOrder ? "" : "Nothing left to check"}
                onClick={() => run("refresh", "refresh-payment", undefined, "Payment status checked with Razorpay.")}
              >
                {busy === "refresh" ? "Checking…" : "Check payment status"}
              </button>
            )}
            {hasRole(user, "ops") && data.status !== "cancelled" && (
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={!!busy}
                onClick={() =>
                  run(
                    "resend",
                    "resend-confirmation",
                    undefined,
                    data.status === "confirmed" ? "Confirmation sent with a fresh pass link." : "Acknowledgement sent.",
                  )
                }
              >
                {data.status === "confirmed" ? "Resend pass" : "Resend email"}
              </button>
            )}
            {hasRole(user, "ops") && canConfirmByHand && (
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={!!busy}
                onClick={() => setDialog("confirm")}
              >
                Confirm by hand
              </button>
            )}
            {hasRole(user, "ops") && data.status !== "cancelled" && (
              <button
                className="btn btn-sm btn-outline-danger"
                disabled={!!busy || paidOnline}
                title={paidOnline ? "Paid online: refund it with Razorpay first" : ""}
                onClick={() => setDialog("cancel")}
              >
                Cancel registration
              </button>
            )}
          </div>

          <ul className="nav nav-tabs mb-3">
            {(["details", "payment", "activity"] as Tab[]).map((t) => (
              <li className="nav-item" key={t}>
                <button className={`nav-link ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                  {t === "activity" && data.audit.length > 0 ? ` (${data.audit.length})` : ""}
                </button>
              </li>
            ))}
          </ul>

          {tab === "details" && (
            <dl className="adm-dl">
              <dt>Name</dt>
              <dd>{data.full_name}</dd>
              <dt>Company</dt>
              <dd>{data.company_name || "—"}</dd>
              <dt>Email</dt>
              <dd>{data.email}</dd>
              <dt>Mobile</dt>
              <dd>{data.mobile}</dd>
              <dt>Category</dt>
              <dd>{data.category_name}</dd>
              <dt>Delegates</dt>
              <dd>{data.delegates}</dd>
              <dt>List price</dt>
              <dd>
                <Money minor={data.quoted_total_minor} currency={data.currency} /> per person, incl. GST
              </dd>
              <dt>Message</dt>
              <dd>{data.message || "—"}</dd>
              <dt>Created</dt>
              <dd>{formatDateTime(data.created_at)}</dd>
              <dt>Entry pass</dt>
              <dd>
                {data.attendee_pass
                  ? `${data.attendee_pass.admitted} of ${data.attendee_pass.admits} admitted${data.attendee_pass.revoked_at ? " · revoked" : ""}`
                  : "Not issued yet"}
              </dd>
            </dl>
          )}

          {tab === "payment" &&
            (data.orders.length === 0 ? (
              <p className="adm-muted">No online payment. This registration is followed up by the secretariat.</p>
            ) : (
              data.orders.map((order) => (
                <div className="adm-card mb-3" key={order.reference}>
                  <div className="adm-card-head">
                    <span className="adm-mono">{order.reference}</span>
                    <StatusBadge value={order.status} />
                  </div>
                  <div className="adm-card-body">
                    <dl className="adm-dl mb-3">
                      <dt>Amount</dt>
                      <dd>
                        <Money minor={order.amount_minor} currency={order.currency} />
                      </dd>
                      {order.tax_breakup.discount_minor ? (
                        <>
                          <dt>Discount</dt>
                          <dd>
                            {order.tax_breakup.discount_percent}% (
                            <Money minor={order.tax_breakup.discount_minor} currency={order.currency} />)
                          </dd>
                        </>
                      ) : null}
                      <dt>Delegates</dt>
                      <dd>{order.tax_breakup.delegates ?? "—"}</dd>
                      <dt>Paid</dt>
                      <dd>{formatDateTime(order.paid_at)}</dd>
                    </dl>
                    <div className="fw-semibold small mb-1">Attempts</div>
                    {order.attempts.length === 0 && <span className="adm-muted small">No payment attempted yet.</span>}
                    {order.attempts.map((a) => (
                      <div className="d-flex justify-content-between small border-top py-2" key={a.provider_payment_id}>
                        <span>
                          <span className="adm-mono">{a.provider_payment_id}</span> · {a.method || "—"}
                          {a.error_description && <span className="text-danger"> · {a.error_description}</span>}
                        </span>
                        <span className="text-nowrap">
                          {a.status} · {formatDateTime(a.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ))}

          {tab === "activity" &&
            (data.audit.length === 0 ? (
              <p className="adm-muted">No staff actions yet.</p>
            ) : (
              <ul className="list-unstyled">
                {data.audit.map((event, i) => (
                  <li className="border-bottom py-2" key={`${event.at}-${i}`}>
                    <div className="fw-semibold">{ACTION_LABEL[event.action] ?? event.action}</div>
                    <div className="small adm-muted">
                      {event.actor || "system"} · {formatDateTime(event.at)}
                    </div>
                    {Object.keys(event.data).length > 0 && <div className="small">{describe(event.data)}</div>}
                  </li>
                ))}
              </ul>
            ))}

          {dialog === "confirm" && (
            <ReasonDialog
              title="Confirm this registration by hand"
              label="How was it paid? (kept in the activity log)"
              submitLabel="Confirm registration"
              busy={busy === "confirm"}
              error={dialogError}
              extra={
                data.delegates === "5 or more" ? (
                  <div className="mt-2">
                    <label className="form-label fw-semibold" htmlFor="admits">
                      How many people does it admit?
                    </label>
                    <input
                      id="admits"
                      type="number"
                      min={1}
                      className="form-control"
                      value={admits}
                      onChange={(e) => setAdmits(e.target.value)}
                    />
                  </div>
                ) : null
              }
              onCancel={() => setDialog(null)}
              onSubmit={(note) =>
                run(
                  "confirm",
                  "confirm",
                  { note, ...(admits ? { admits: Number(admits) } : {}) },
                  "Registration confirmed and the pass emailed.",
                )
              }
            />
          )}
          {dialog === "cancel" && (
            <ReasonDialog
              title="Cancel this registration"
              label="Reason (kept in the activity log)"
              submitLabel="Cancel registration"
              danger
              busy={busy === "cancel"}
              error={dialogError}
              onCancel={() => setDialog(null)}
              onSubmit={(reason) => run("cancel", "cancel", { reason }, "Registration cancelled.")}
            />
          )}
        </>
      )}
    </Drawer>
  );
}
