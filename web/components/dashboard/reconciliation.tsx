"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, Card, Spinner } from "@/components/ui/primitives";
import { OrderStatusChip } from "@/components/ui/status";
import { formatDateTime, formatINR, formatINRShort } from "@/lib/format";
import { refreshOrderStatus, useRegistrations } from "@/lib/mock/api";
import { getEvent } from "@/lib/mock/data";

import { Kpi, PageHeader, STAFF_USER } from "./shell";

// Mock of the nightly ReconciliationRun (IMPLEMENTATION.md §6.5). Gateway-side numbers are simulated.
export function Reconciliation() {
  const all = useRegistrations();
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  if (!all) return <Spinner className="size-6 text-brand-blue-600" />;

  const paid = all.filter((r) => r.order.status === "PAID");
  const captured = paid.reduce((s, r) => s + r.order.amountPaise, 0);
  const fees = Math.round(captured * 0.02);
  const feeGst = Math.round(fees * 0.18);
  const exceptions = all.filter(
    (r) => r.order.status === "MISMATCH" || (r.order.status === "PENDING" && r.order.attempts.length > 0) || r.order.pendingOutcome,
  );
  const stalePending = all.filter((r) => r.order.status === "PENDING" && now - new Date(r.createdAt).getTime() > 3600_000);

  return (
    <>
      <PageHeader
        title="Reconciliation"
        description={`Compares our orders against gateway payments and settlements · last run ${ranAt ? formatDateTime(ranAt) : "today 02:00 IST"}`}
        actions={
          <Button
            size="sm"
            loading={running}
            onClick={async () => {
              setRunning(true);
              await new Promise((r) => setTimeout(r, 1200));
              setRanAt(new Date().toISOString());
              setRunning(false);
            }}
          >
            Run now
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Matched payments" value={String(paid.length)} tone="success" sub={formatINRShort(captured) + " captured"} />
        <Kpi label="Exceptions" value={String(exceptions.length)} tone={exceptions.length ? "danger" : "success"} sub="Mismatch or unresolved" />
        <Kpi label="Stale pending > 1h" value={String(stalePending.length)} tone={stalePending.length ? "warning" : undefined} sub="Seat holds to release" />
        <Kpi label="Expected settlement" value={formatINRShort(captured - fees - feeGst)} sub={`Fees ${formatINRShort(fees)} + GST ${formatINRShort(feeGst)} (simulated)`} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-line-200 px-5 py-4">
          <h2 className="font-semibold text-ink-900">Exception queue</h2>
          <p className="text-sm text-ink-500">Confirmation stays blocked until finance resolves these.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-100 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3">Order</th>
                <th scope="col" className="px-5 py-3">Attendee</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3 text-right">Expected</th>
                <th scope="col" className="px-5 py-3">Issue</th>
                <th scope="col" className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-200">
              {exceptions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-500">No exceptions. Everything reconciles.</td></tr>
              )}
              {exceptions.map((r) => (
                <tr key={r.publicId}>
                  <td className="px-5 py-3 font-mono text-xs">{r.order.reference}</td>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/registrations?open=${r.publicId}`} className="font-medium text-brand-blue-600 hover:underline">
                      {r.person.fullName}
                    </Link>
                    <p className="text-xs text-ink-500">{getEvent(r.eventSlug)?.shortTitle}</p>
                  </td>
                  <td className="px-5 py-3"><OrderStatusChip status={r.order.pendingOutcome ? "PROCESSING" : r.order.status} /></td>
                  <td className="tnum px-5 py-3 text-right">{formatINR(r.order.amountPaise)}</td>
                  <td className="px-5 py-3 text-xs text-ink-700">
                    {r.order.status === "MISMATCH" ? "Webhook amount differs from order" : "Gateway result not final"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === r.publicId}
                      onClick={async () => {
                        setBusy(r.publicId);
                        await refreshOrderStatus(r.publicId, STAFF_USER);
                        setBusy(null);
                      }}
                    >
                      Query gateway
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
