"use client";

import clsx from "clsx";
import { Download, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, Spinner } from "@/components/ui/primitives";
import { MemberChip, OrderStatusChip } from "@/components/ui/status";
import { formatDateTime, formatINR } from "@/lib/format";
import { refreshOrderStatus, resendConfirmation, reviewMember, useRegistrations } from "@/lib/mock/api";
import { EVENTS, getEvent } from "@/lib/mock/data";
import type { OrderStatus, Registration } from "@/lib/types";

import { PageHeader, STAFF_USER } from "./shell";

const selectCls = "h-10 rounded-[var(--radius-control)] border border-ink-400 bg-white px-3 text-sm";

export function Registrations() {
  const all = useRegistrations();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [event, setEvent] = useState("all");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [audience, setAudience] = useState("all");
  const [review, setReview] = useState(false);
  const openId = search.get("open");

  const rows = useMemo(() => {
    if (!all) return [];
    const needle = q.trim().toLowerCase();
    return all.filter(
      (r) =>
        (event === "all" || r.eventSlug === event) &&
        (status === "all" || r.order.status === status) &&
        (audience === "all" || r.claimedAudience === audience) &&
        (!review || r.memberValidation === "PENDING_REVIEW") &&
        (!needle ||
          [r.publicId, r.person.fullName, r.person.email, r.person.organisation, r.person.mobile, r.order.reference]
            .join(" ")
            .toLowerCase()
            .includes(needle)),
    );
  }, [all, q, event, status, audience, review]);

  const selected = all?.find((r) => r.publicId === openId) ?? null;
  const setOpen = (id: string | null) => {
    const p = new URLSearchParams(search);
    if (id) p.set("open", id);
    else p.delete("open");
    router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  function exportCsv() {
    const header = ["registration_id", "event", "category", "name", "email", "mobile", "organisation", "designation", "state", "gstin", "member_validation", "order_ref", "order_status", "amount_inr", "created_at", "checked_in_at"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [
        r.publicId, r.eventSlug, getEvent(r.eventSlug)?.categories.find((c) => c.id === r.categoryId)?.name, r.person.fullName,
        r.person.email, r.person.mobile, r.person.organisation, r.person.designation, r.person.state, r.billing.gstin,
        r.memberValidation, r.order.reference, r.order.status, (r.order.amountPaise / 100).toFixed(2), r.createdAt, r.pass?.checkedInAt,
      ].map(esc).join(","),
    );
    const url = URL.createObjectURL(new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `amai-registrations-${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(url);
  }

  if (!all) return <Spinner className="size-6 text-brand-blue-600" />;

  return (
    <>
      <PageHeader
        title="Registrations"
        description={`${rows.length} of ${all.length} registrations`}
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 rounded-[var(--radius-card)] border border-line-200 bg-white p-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, org, ID, order ref…"
            className="h-10 w-full rounded-[var(--radius-control)] border border-ink-400 pr-3 pl-9 text-sm focus:border-brand-blue-600 focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select value={event} onChange={(e) => setEvent(e.target.value)} className={selectCls} aria-label="Event">
            <option value="all">All events</option>
            {EVENTS.filter((e) => e.status === "open").map((e) => (
              <option key={e.slug} value={e.slug}>{e.shortTitle}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "all")} className={selectCls} aria-label="Payment status">
            <option value="all">Any payment status</option>
            {["PAID", "PENDING", "FAILED", "CANCELLED", "MISMATCH", "REFUNDED"].map((s) => (
              <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className={selectCls} aria-label="Audience">
            <option value="all">Member + non-member</option>
            <option value="MEMBER">Member</option>
            <option value="NON_MEMBER">Non-member</option>
            <option value="STUDENT">Student</option>
          </select>
          <label className="flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-ink-400 px-3 text-sm whitespace-nowrap">
            <input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} className="accent-brand-blue-600" />
            Needs review
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line-200 bg-white">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="sticky top-0 bg-surface-100 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">Registration</th>
              <th scope="col" className="px-4 py-3">Attendee</th>
              <th scope="col" className="px-4 py-3">Event · category</th>
              <th scope="col" className="px-4 py-3">Member</th>
              <th scope="col" className="px-4 py-3">Payment</th>
              <th scope="col" className="px-4 py-3 text-right">Amount</th>
              <th scope="col" className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-200">
            {rows.map((r) => {
              const ev = getEvent(r.eventSlug);
              const cat = ev?.categories.find((c) => c.id === r.categoryId);
              return (
                <tr
                  key={r.publicId}
                  onClick={() => setOpen(r.publicId)}
                  className={clsx("cursor-pointer hover:bg-brand-blue-50", openId === r.publicId && "bg-brand-blue-50")}
                >
                  <td className="px-4 py-3">
                    <button type="button" className="font-mono text-xs text-brand-blue-600 hover:underline" onClick={() => setOpen(r.publicId)}>
                      {r.publicId}
                    </button>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-medium text-ink-900">{r.person.fullName}</p>
                    <p className="truncate text-xs text-ink-500">{r.person.organisation}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink-900">{ev?.shortTitle}</p>
                    <p className="text-xs text-ink-500">{cat?.name}</p>
                  </td>
                  <td className="px-4 py-3"><MemberChip value={r.memberValidation} /></td>
                  <td className="px-4 py-3">
                    <OrderStatusChip status={r.order.pendingOutcome ? "PROCESSING" : r.order.status} />
                    {r.pass?.checkedInAt && <p className="mt-1 text-xs text-success">Checked in</p>}
                  </td>
                  <td className="tnum px-4 py-3 text-right text-ink-900">{formatINR(r.order.amountPaise)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-ink-500">{formatDateTime(r.createdAt)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-500">No registrations match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <RecordDrawer reg={selected} onClose={() => setOpen(null)} />}
    </>
  );
}

const TABS = ["Details", "Payments", "Messages", "Audit"] as const;

function RecordDrawer({ reg, onClose }: { reg: Registration; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Details");
  const [busy, setBusy] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const ev = getEvent(reg.eventSlug);
  const cat = ev?.categories.find((c) => c.id === reg.categoryId);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const act = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    await fn();
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl animate-rise flex-col bg-white shadow-2xl">
        <div className="border-b border-line-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs text-ink-500">{reg.publicId}</p>
              <h2 id="drawer-title" className="mt-1 truncate text-xl font-semibold">{reg.person.fullName}</h2>
              <p className="truncate text-sm text-ink-500">{ev?.shortTitle} · {cat?.name}</p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="rounded-md p-2 hover:bg-surface-100" aria-label="Close record">
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <OrderStatusChip status={reg.order.pendingOutcome ? "PROCESSING" : reg.order.status} />
            <MemberChip value={reg.memberValidation} />
          </div>
        </div>

        <div role="tablist" className="flex gap-1 border-b border-line-200 px-3">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={clsx(
                "-mb-px border-b-2 px-3 py-2.5 text-sm",
                tab === t ? "border-brand-blue-600 font-semibold text-brand-blue-600" : "border-transparent text-ink-500 hover:text-ink-900",
              )}
            >
              {t}
              {t === "Messages" && <span className="ml-1 text-xs text-ink-400">{reg.messages.length}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5" role="tabpanel">
          {tab === "Details" && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {(
                [
                  ["Email", reg.person.email],
                  ["Mobile", reg.person.mobile],
                  ["Organisation", reg.person.organisation],
                  ["Designation", reg.person.designation],
                  ["Location", `${reg.person.city}, ${reg.person.state}`],
                  ["Member identifier", reg.memberIdentifier ?? "—"],
                  ["Invoice to", reg.billing.billingName],
                  ["GSTIN", reg.billing.gstin ?? "—"],
                  ["Source", reg.utmSource ?? "direct"],
                  ["Marketing consent", reg.consentMarketing ? "Yes" : "No"],
                  ["Check-in", reg.pass?.checkedInAt ? `${formatDateTime(reg.pass.checkedInAt)} by ${reg.pass.checkedInBy}` : "Not yet"],
                  ["Created", formatDateTime(reg.createdAt)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="truncate font-medium text-ink-900" title={v}>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "Payments" && (
            <div className="space-y-5">
              <dl className="tnum grid grid-cols-3 gap-3 rounded-[var(--radius-control)] bg-surface-100 p-4 text-sm">
                <div><dt className="text-ink-500">Taxable</dt><dd className="font-medium">{formatINR(reg.order.quote.taxablePaise)}</dd></div>
                <div><dt className="text-ink-500">GST {reg.order.quote.gstRate}%</dt><dd className="font-medium">{formatINR(reg.order.quote.gstPaise)}</dd></div>
                <div><dt className="text-ink-500">Total</dt><dd className="font-semibold">{formatINR(reg.order.amountPaise)}</dd></div>
              </dl>
              <p className="text-sm text-ink-500">
                Order <span className="font-mono text-ink-900">{reg.order.reference}</span>. Attempts are append-only.
              </p>
              <ol className="space-y-3">
                {reg.order.attempts.length === 0 && <li className="text-sm text-ink-500">No payment attempts yet.</li>}
                {reg.order.attempts.map((a) => (
                  <li key={a.id} className="rounded-[var(--radius-control)] border border-line-200 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize text-ink-900">{a.method} · {a.status}</span>
                      <span className="text-xs text-ink-500">{formatDateTime(a.at)}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink-500">{a.providerPaymentId}</p>
                    {a.error && <p className="mt-1 text-xs text-danger">{a.error}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tab === "Messages" && (
            <ul className="divide-y divide-line-200 text-sm">
              {reg.messages.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{m.template} <span className="text-xs font-normal text-ink-500 uppercase">{m.channel}</span></p>
                    <p className="truncate text-xs text-ink-500">{m.to} · {formatDateTime(m.at)}</p>
                  </div>
                  <span className={clsx("text-xs font-semibold", m.status === "DELIVERED" ? "text-success" : m.status === "BOUNCED" || m.status === "FAILED" ? "text-danger" : "text-warning")}>
                    {m.status}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {tab === "Audit" && (
            <ol className="relative space-y-4 border-l-2 border-line-200 pl-5 text-sm">
              {[...reg.audit].reverse().map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-brand-blue-600" />
                  <p className="font-mono text-xs text-ink-900">{a.action}</p>
                  <p className="text-xs text-ink-500">{a.actor} · {formatDateTime(a.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line-200 p-4">
          {reg.memberValidation === "PENDING_REVIEW" && (
            <>
              <Button size="sm" loading={busy === "approve"} onClick={() => act("approve", () => reviewMember(reg.publicId, "VERIFIED", STAFF_USER))}>
                Approve membership
              </Button>
              <Button size="sm" variant="danger" loading={busy === "reject"} onClick={() => act("reject", () => reviewMember(reg.publicId, "REJECTED", STAFF_USER))}>
                Reject
              </Button>
            </>
          )}
          <Button size="sm" variant="secondary" loading={busy === "resend"} onClick={() => act("resend", () => resendConfirmation(reg.publicId, STAFF_USER))}>
            Resend email
          </Button>
          {reg.order.status !== "PAID" && (
            <Button size="sm" variant="secondary" loading={busy === "refresh"} onClick={() => act("refresh", () => refreshOrderStatus(reg.publicId, STAFF_USER))}>
              Query gateway status
            </Button>
          )}
          {reg.order.status === "PAID" && (
            <Button size="sm" variant="tertiary" disabled title="Finance role, via backend">
              Refund…
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
