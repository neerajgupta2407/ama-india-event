"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState, Kpi, Notice, PageHeader, Spinner } from "@/components/admin/ui";
import { URLS } from "@/config/urls";
import { useStaff } from "@/contexts/StaffContext";
import { useApi } from "@/hooks/useApi";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import type { ReconciliationException, ReconciliationRun } from "@/types/staff";
import { errorMessage, formatDateTime, hasRole } from "@/utils/staff";

const ISSUE: Record<ReconciliationException["issue"], { label: string; cls: string }> = {
  mismatch: { label: "Mismatch", cls: "bg-danger" },
  paid_not_captured: { label: "Paid here, not captured", cls: "bg-danger" },
  duplicate_capture: { label: "Duplicate capture", cls: "bg-danger" },
  stale_pending: { label: "Stuck pending", cls: "bg-warning text-dark" },
  provider_unreachable: { label: "Razorpay unreachable", cls: "bg-secondary" },
};

export default function ReconciliationPage() {
  const { user } = useStaff();
  const { post } = useApi();
  const { data: runs, error, loading, refetch } = useStaffQuery<ReconciliationRun[]>(URLS.STAFF_RECONCILIATION);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  async function runNow() {
    setRunning(true);
    setRunError(null);
    try {
      await post<ReconciliationRun>(URLS.STAFF_RECONCILIATION_RUN, {});
      refetch();
    } catch (caught) {
      setRunError(errorMessage(caught));
    } finally {
      setRunning(false);
    }
  }

  const latest = runs?.[0];
  return (
    <>
      <PageHeader
        title="Reconciliation"
        description="Checks our payment records against Razorpay and lists anything that does not agree"
        actions={
          hasRole(user, "finance") ? (
            <button className="btn btn-adm" onClick={runNow} disabled={running}>
              {running ? "Checking with Razorpay…" : "Run now"}
            </button>
          ) : undefined
        }
      />
      {error && <Notice kind="danger">{error}</Notice>}
      {runError && <Notice kind="danger">{runError}</Notice>}
      {!runs && loading && <Spinner />}
      {runs && !latest && <EmptyState>No reconciliation has been run yet.</EmptyState>}

      {latest && (
        <>
          <p className="adm-muted small">
            Last run {formatDateTime(latest.finished_at ?? latest.created_at)} by{" "}
            {latest.triggered_by_label || "the system"}
            {latest.event_slug ? ` · ${latest.event_slug}` : ""}
          </p>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <Kpi label="Orders checked" value={String(latest.orders_checked)} />
            </div>
            <div className="col-6 col-lg-3">
              <Kpi
                label="Matched"
                value={String(latest.matched)}
                tone="success"
                sub="Paid and captured for the right amount"
              />
            </div>
            <div className="col-6 col-lg-3">
              <Kpi label="Recovered" value={String(latest.recovered)} sub="Were paid but not yet confirmed" />
            </div>
            <div className="col-6 col-lg-3">
              <Kpi
                label="Exceptions"
                value={String(latest.exceptions.length)}
                tone={latest.exceptions.length ? "danger" : "success"}
              />
            </div>
          </div>

          <div className="adm-card mb-4">
            <div className="adm-card-head">Exceptions</div>
            {latest.exceptions.length === 0 ? (
              <EmptyState>Everything agrees with Razorpay.</EmptyState>
            ) : (
              <div className="adm-scroll-x">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Issue</th>
                      <th>What to do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.exceptions.map((e) => (
                      <tr key={`${e.order}-${e.issue}`}>
                        <td>
                          <Link className="adm-mono" href={`/dashboard/registrations/?id=${e.registration}`}>
                            {e.order}
                          </Link>
                          <div className="small adm-muted">{e.registration}</div>
                        </td>
                        <td>
                          <span className={`badge ${ISSUE[e.issue].cls}`}>{ISSUE[e.issue].label}</span>
                        </td>
                        <td>{e.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {runs && runs.length > 1 && (
            <div className="adm-card">
              <div className="adm-card-head">Earlier runs</div>
              <div className="adm-scroll-x">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>By</th>
                      <th className="num">Checked</th>
                      <th className="num">Matched</th>
                      <th className="num">Exceptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.slice(1).map((run) => (
                      <tr key={run.id}>
                        <td className="text-nowrap">{formatDateTime(run.finished_at ?? run.created_at)}</td>
                        <td>{run.triggered_by_label || "system"}</td>
                        <td className="num">{run.orders_checked}</td>
                        <td className="num">{run.matched}</td>
                        <td className="num">{run.exceptions.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
