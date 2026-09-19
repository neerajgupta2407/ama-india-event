"use client";

import { AlertTriangle, ArrowRight, ShieldQuestion, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Card, Spinner } from "@/components/ui/primitives";
import { Chip } from "@/components/ui/status";
import { formatDateTime, formatINRShort } from "@/lib/format";
import { useRegistrations } from "@/lib/mock/api";
import { EVENTS, getEvent } from "@/lib/mock/data";

import { Kpi, PageHeader } from "./shell";

export function Overview() {
  const all = useRegistrations();
  const [eventSlug, setEventSlug] = useState("all");
  if (!all) return <Spinner className="size-6 text-brand-blue-600" />;

  const regs = eventSlug === "all" ? all : all.filter((r) => r.eventSlug === eventSlug);
  const paid = regs.filter((r) => r.order.status === "PAID");
  const pending = regs.filter((r) => ["PENDING", "FAILED", "CANCELLED"].includes(r.order.status));
  const revenue = paid.reduce((s, r) => s + r.order.quote.taxablePaise, 0);
  const gst = paid.reduce((s, r) => s + r.order.quote.gstPaise, 0);
  const checkedIn = regs.filter((r) => r.pass?.checkedInAt).length;

  const attention = [
    ...regs.filter((r) => r.order.status === "MISMATCH").map((r) => ({ r, Icon: AlertTriangle, tone: "danger" as const, why: "Payment mismatch: confirmation blocked" })),
    ...regs.filter((r) => r.memberValidation === "PENDING_REVIEW").map((r) => ({ r, Icon: ShieldQuestion, tone: "warning" as const, why: "Member status needs review" })),
    ...regs.filter((r) => r.order.status === "FAILED").map((r) => ({ r, Icon: XCircle, tone: "neutral" as const, why: "Payment failed: no retry yet" })),
  ];

  const bySource = Object.entries(
    paid.reduce<Record<string, number>>((acc, r) => ((acc[r.utmSource ?? "direct"] = (acc[r.utmSource ?? "direct"] ?? 0) + 1), acc), {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...bySource.map(([, n]) => n));

  const openEvents = EVENTS.filter((e) => e.status === "open");

  return (
    <>
      <PageHeader
        title="Overview"
        description="Registrations and payments across AMAI events"
        actions={
          <select
            value={eventSlug}
            onChange={(e) => setEventSlug(e.target.value)}
            className="h-10 rounded-[var(--radius-control)] border border-ink-400 bg-white px-3 text-sm"
            aria-label="Filter by event"
          >
            <option value="all">All events</option>
            {openEvents.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.shortTitle}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Kpi label="Registrations" value={String(regs.length)} sub="All statuses" />
        <Kpi label="Paid" value={String(paid.length)} tone="success" sub={`${Math.round((paid.length / Math.max(1, regs.length)) * 100)}% conversion`} />
        <Kpi label="Awaiting payment" value={String(pending.length)} tone="warning" sub="Pending, failed or cancelled" />
        <Kpi label="Revenue (ex-GST)" value={formatINRShort(revenue)} sub={`GST collected ${formatINRShort(gst)}`} />
        <Kpi label="Checked in" value={String(checkedIn)} sub={`of ${paid.length} paid`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-line-200 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Needs attention</h2>
            <Chip tone={attention.length ? "warning" : "success"}>{attention.length}</Chip>
          </div>
          {attention.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">All clear.</p>
          ) : (
            <ul className="divide-y divide-line-200">
              {attention.slice(0, 8).map(({ r, Icon, tone, why }) => (
                <li key={r.publicId + why}>
                  <Link
                    href={`/dashboard/registrations?open=${r.publicId}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-brand-blue-50/60"
                  >
                    <Chip tone={tone} icon={Icon} className="shrink-0">
                      {tone === "danger" ? "Urgent" : tone === "warning" ? "Review" : "Follow up"}
                    </Chip>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900">
                        {r.person.fullName} · {r.person.organisation}
                      </span>
                      <span className="block truncate text-xs text-ink-500">
                        {why} · {getEvent(r.eventSlug)?.shortTitle} · {formatDateTime(r.createdAt)}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-ink-900">Seats by event</h2>
            <ul className="mt-4 space-y-4">
              {openEvents.map((e) => {
                const cap = e.categories.reduce((s, c) => s + (c.capacity ?? 0), 0);
                const taken = e.categories.reduce((s, c) => s + c.seatsTaken, 0);
                const pct = cap ? Math.min(100, Math.round((taken / cap) * 100)) : null;
                return (
                  <li key={e.slug}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-ink-900">{e.shortTitle}</span>
                      <span className="tnum text-ink-500">{cap ? `${taken} / ${cap}` : `${taken} · no cap`}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-100">
                      <div
                        className={pct !== null && pct >= 90 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-brand-blue-600"}
                        style={{ width: `${pct ?? 30}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-ink-900">Paid registrations by source</h2>
            <p className="text-xs text-ink-500">From UTM tags and campaign QR codes</p>
            <ul className="mt-4 space-y-2.5">
              {bySource.map(([src, n]) => (
                <li key={src} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-sm">
                  <span className="truncate text-ink-700">{src}</span>
                  <span className="h-2 rounded-full bg-brand-blue-100">
                    <span className="block h-full rounded-full bg-brand-blue-600" style={{ width: `${(n / maxSource) * 100}%` }} />
                  </span>
                  <span className="tnum text-right text-ink-900">{n}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
