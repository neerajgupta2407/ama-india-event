"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Kpi, Notice, PageHeader, Spinner, StatusBadge } from "@/components/admin/ui";
import { URLS } from "@/config/urls";
import { useStaff } from "@/contexts/StaffContext";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import type { AttentionItem, Overview } from "@/types/staff";
import { formatDateTime, formatMinor, hasRole, queryString } from "@/utils/staff";
import { VIEW_ROLES } from "@/utils/staffHome";

const SEVERITY_BADGE: Record<AttentionItem["severity"], { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-danger" },
  review: { label: "Review", cls: "bg-warning text-dark" },
  follow_up: { label: "Follow up", cls: "bg-secondary" },
};

export default function OverviewPage() {
  const router = useRouter();
  const { user } = useStaff();
  const canView = hasRole(user, ...VIEW_ROLES);
  const [event, setEvent] = useState("");
  const { data, error, loading } = useStaffQuery<Overview>(
    canView ? `${URLS.STAFF_OVERVIEW}${queryString({ event })}` : null,
  );

  useEffect(() => {
    if (!canView) router.replace("/dashboard/check-in/");
  }, [canView, router]);

  if (!canView) return <Spinner />;
  if (error) return <Notice kind="danger">{error}</Notice>;
  if (!data) return <Spinner />;

  const { registrations: reg, payments } = data;
  const conversion = reg.total ? Math.round((reg.confirmed / reg.total) * 100) : 0;
  const maxCategory = Math.max(1, ...data.by_category.map((c) => c.total));

  return (
    <>
      <PageHeader
        title="Overview"
        description="Registrations and payments at a glance"
        actions={
          <select
            className="form-select"
            aria-label="Filter by event"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">All events</option>
            {data.events.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.title}
              </option>
            ))}
          </select>
        }
      />
      <div style={{ opacity: loading ? 0.6 : 1 }}>
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <Kpi
              label="Registrations"
              value={String(reg.total)}
              sub={`${reg.requested} requested · ${reg.cancelled} cancelled`}
            />
          </div>
          <div className="col-6 col-lg-3">
            <Kpi
              label="Confirmed"
              value={String(reg.confirmed)}
              tone="success"
              sub={`${conversion}% of all registrations`}
            />
          </div>
          <div className="col-6 col-lg-3">
            <Kpi
              label="Awaiting payment"
              value={String(reg.pending_payment)}
              tone="warning"
              sub={`${payments.failed} failed attempts`}
            />
          </div>
          <div className="col-6 col-lg-3">
            <Kpi
              label="Checked in"
              value={`${data.check_in.admitted} / ${data.check_in.expected}`}
              sub="people admitted of people expected"
            />
          </div>
          {payments.revenue.length === 0 && (
            <div className="col-12 col-lg-6">
              <Kpi label="Revenue" value="—" sub="No paid orders yet" />
            </div>
          )}
          {payments.revenue.map((row) => (
            <div className="col-12 col-lg-6" key={row.currency}>
              <Kpi
                label={`Revenue (${row.currency}, before GST)`}
                value={formatMinor(row.taxable_minor, row.currency)}
                sub={`GST ${formatMinor(row.gst_minor, row.currency)} · ${row.orders} paid order${row.orders === 1 ? "" : "s"} · total ${formatMinor(row.total_minor, row.currency)}`}
              />
            </div>
          ))}
        </div>

        <div className="row g-3">
          <div className="col-xl-7">
            <div className="adm-card">
              <div className="adm-card-head">
                Needs attention
                <span className={`badge ${data.attention.length ? "bg-warning text-dark" : "bg-success"}`}>
                  {data.attention.length}
                </span>
              </div>
              {data.attention.length === 0 ? (
                <div className="adm-card-body adm-muted">All clear.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {data.attention.map((item) => (
                    <li className="list-group-item" key={`${item.kind}-${item.registration}`}>
                      <Link
                        href={`/dashboard/registrations/?id=${item.registration}`}
                        className="d-flex align-items-center gap-3 text-decoration-none text-reset"
                      >
                        <span className={`badge ${SEVERITY_BADGE[item.severity].cls}`}>
                          {SEVERITY_BADGE[item.severity].label}
                        </span>
                        <span className="flex-grow-1 min-w-0">
                          <span className="d-block fw-semibold text-truncate">
                            {item.name}
                            {item.company ? ` · ${item.company}` : ""}
                          </span>
                          <span className="d-block small adm-muted">
                            {item.detail} · {item.registration} · {formatDateTime(item.at)}
                          </span>
                        </span>
                        <i className="bi bi-chevron-right adm-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-xl-5 d-flex flex-column gap-3">
            <div className="adm-card">
              <div className="adm-card-head">Registrations by category</div>
              <div className="adm-card-body">
                {data.by_category.length === 0 && <span className="adm-muted">None yet.</span>}
                {data.by_category.map((c) => (
                  <div className="mb-3" key={c.code}>
                    <div className="d-flex justify-content-between small">
                      <span className="fw-semibold">{c.name}</span>
                      <span className="adm-muted">
                        {c.confirmed} confirmed of {c.total}
                      </span>
                    </div>
                    <div className="adm-bar mt-1">
                      <span style={{ width: `${(c.total / maxCategory) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="adm-card">
              <div className="adm-card-head">Queues</div>
              <ul className="list-group list-group-flush">
                <QueueLink
                  href="/dashboard/registrations/?member_validation=pending_review"
                  label="Membership to review"
                  count={data.member_reviews_pending}
                  badge="pending_review"
                />
                <QueueLink
                  href="/dashboard/payments/?status=mismatch"
                  label="Payment mismatches"
                  count={payments.mismatch}
                  badge="mismatch"
                />
                <QueueLink
                  href="/dashboard/payments/?status=failed"
                  label="Failed payments"
                  count={payments.failed}
                  badge="failed"
                />
                <QueueLink
                  href="/dashboard/enquiries/?status=new"
                  label="New enquiries"
                  count={data.enquiries_new}
                  badge="new"
                />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function QueueLink({ href, label, count, badge }: { href: string; label: string; count: number; badge: string }) {
  return (
    <li className="list-group-item">
      <Link href={href} className="d-flex justify-content-between align-items-center text-decoration-none text-reset">
        <span>{label}</span>
        <span className="d-flex align-items-center gap-2">
          {count > 0 ? <StatusBadge value={badge} /> : null}
          <b>{count}</b>
        </span>
      </Link>
    </li>
  );
}
