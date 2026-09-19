"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, ScanLine, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, Card } from "@/components/ui/primitives";
import { formatTime } from "@/lib/format";
import { checkIn, useRegistrations, type CheckInResult } from "@/lib/mock/api";
import { EVENTS, getEvent } from "@/lib/mock/data";

import { PageHeader, STAFF_USER } from "./shell";

export function CheckIn() {
  const all = useRegistrations();
  const [event, setEvent] = useState(EVENTS[0].slug);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const eventRegs = useMemo(() => (all ?? []).filter((r) => r.eventSlug === event && r.status === "CONFIRMED"), [all, event]);
  const checked = eventRegs.filter((r) => r.pass?.checkedInAt).sort((a, b) => b.pass!.checkedInAt!.localeCompare(a.pass!.checkedInAt!));
  const matches = q.trim().length >= 2
    ? eventRegs.filter((r) => [r.person.fullName, r.person.mobile, r.publicId, r.person.organisation].join(" ").toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];

  async function submit(value: string) {
    if (!value.trim()) return;
    setBusy(true);
    const res = await checkIn(value, STAFF_USER);
    setResult(res);
    setBusy(false);
    setCode("");
    if ("vibrate" in navigator) navigator.vibrate(res.result === "OK" ? 80 : [60, 60, 60]);
    inputRef.current?.focus();
  }

  const view = result && {
    OK: { cls: "bg-success text-white", Icon: CheckCircle2, title: "Checked in" },
    ALREADY_CHECKED_IN: { cls: "bg-danger text-white", Icon: AlertTriangle, title: "Already checked in" },
    NOT_PAID: { cls: "bg-warning text-white", Icon: XCircle, title: "Not a paid registration" },
    INVALID: { cls: "bg-danger text-white", Icon: XCircle, title: "Invalid pass" },
  }[result.result];

  return (
    <>
      <PageHeader
        title="Check-in"
        description="Scan an attendee QR pass. A pass can only be used once."
        actions={
          <select value={event} onChange={(e) => setEvent(e.target.value)} className="h-10 rounded-[var(--radius-control)] border border-ink-400 bg-white px-3 text-sm" aria-label="Event">
            {EVENTS.filter((e) => e.status === "open").map((e) => (
              <option key={e.slug} value={e.slug}>{e.shortTitle}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(code);
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <label className="relative flex-1">
                <span className="sr-only">Pass code or registration ID</span>
                <ScanLine className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-400" />
                <input
                  ref={inputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Scan QR or type registration ID"
                  className="h-12 w-full rounded-[var(--radius-control)] border border-ink-400 pr-3 pl-10 text-base focus:border-brand-blue-600 focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
                  autoComplete="off"
                />
              </label>
              <Button type="submit" size="lg" loading={busy}>Check in</Button>
            </form>
            <p className="mt-2 text-xs text-ink-500">
              Handheld scanners type into this box. The camera scanner (<code>@zxing/browser</code>) plugs in here in the full build.
            </p>
          </Card>

          <div
            aria-live="assertive"
            className={clsx(
              "flex min-h-44 flex-col items-center justify-center rounded-[var(--radius-card)] p-6 text-center transition-colors",
              view ? view.cls : "border-2 border-dashed border-line-200 bg-white text-ink-500",
            )}
          >
            {!view || !result ? (
              <>
                <ScanLine className="size-10 opacity-60" aria-hidden />
                <p className="mt-2">Waiting for a scan…</p>
              </>
            ) : (
              <>
                <view.Icon className="size-12" aria-hidden />
                <p className="mt-2 text-2xl font-bold">{view.title}</p>
                {"registration" in result && (
                  <>
                    <p className="mt-1 text-xl">{result.registration.person.fullName}</p>
                    <p className="text-sm opacity-90">
                      {result.registration.person.organisation} ·{" "}
                      {getEvent(result.registration.eventSlug)?.categories.find((c) => c.id === result.registration.categoryId)?.name}
                    </p>
                    {result.result === "ALREADY_CHECKED_IN" && (
                      <p className="mt-2 text-sm font-semibold">
                        First scan at {formatTime(result.registration.pass!.checkedInAt!)} by {result.registration.pass!.checkedInBy}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold text-ink-900"><Search className="size-4" /> Manual lookup</h2>
            <p className="text-sm text-ink-500">If a phone won’t scan, search by name, mobile or ID.</p>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Sharma or 98…"
              className="mt-3 h-11 w-full rounded-[var(--radius-control)] border border-ink-400 px-3 text-base focus:border-brand-blue-600 focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
            />
            <ul className="mt-2 divide-y divide-line-200">
              {matches.map((r) => (
                <li key={r.publicId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{r.person.fullName}</p>
                    <p className="truncate font-mono text-xs text-ink-500">{r.publicId}</p>
                  </div>
                  {r.pass?.checkedInAt ? (
                    <span className="text-xs text-success">In at {formatTime(r.pass.checkedInAt)}</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => submit(r.publicId)}>Check in</Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-line-200 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Checked in</h2>
            <span className="tnum text-sm text-ink-500">{checked.length} / {eventRegs.length}</span>
          </div>
          <div className="px-5 pt-4">
            <div className="h-2 overflow-hidden rounded-full bg-surface-100">
              <div className="h-full rounded-full bg-success" style={{ width: `${(checked.length / Math.max(1, eventRegs.length)) * 100}%` }} />
            </div>
          </div>
          <ul className="max-h-[520px] divide-y divide-line-200 overflow-y-auto">
            {checked.length === 0 && <li className="p-5 text-sm text-ink-500">Nobody yet. Try the manual lookup, or scan a pass from a completed registration.</li>}
            {checked.map((r) => (
              <li key={r.publicId} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink-900">{r.person.fullName}</span>
                  <span className="block truncate text-xs text-ink-500">{r.person.organisation}</span>
                </span>
                <span className="tnum text-xs text-ink-500">{formatTime(r.pass!.checkedInAt!)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
