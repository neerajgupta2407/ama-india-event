"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { Notice, PageHeader } from "@/components/admin/ui";
import { URLS } from "@/config/urls";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import type { CheckInOutcome, CheckInResultCode, CheckInSearchRow, RecentCheckIn } from "@/types/staff";
import { errorMessage, formatTime, queryString } from "@/utils/staff";

const RESULT: Record<CheckInResultCode, { title: string; tone: "ok" | "warn" | "bad"; icon: string }> = {
  OK: { title: "Checked in", tone: "ok", icon: "check-circle-fill" },
  ALREADY_CHECKED_IN: { title: "Already checked in", tone: "bad", icon: "exclamation-triangle-fill" },
  NOT_PAID: { title: "Not a confirmed registration", tone: "warn", icon: "x-circle-fill" },
  REVOKED: { title: "This pass was cancelled", tone: "bad", icon: "x-octagon-fill" },
  INVALID: { title: "Pass not recognised", tone: "bad", icon: "x-octagon-fill" },
};

export default function CheckInPage() {
  const { post } = useApi();
  const input = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [gate, setGate] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<CheckInOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");
  const debounced = useDebounced(lookup);
  const recent = useStaffQuery<RecentCheckIn[]>(URLS.STAFF_CHECKIN_RECENT);
  const found = useStaffQuery<CheckInSearchRow[]>(
    debounced.trim().length >= 2 ? `${URLS.STAFF_CHECKIN_SEARCH}${queryString({ q: debounced })}` : null,
  );
  const { refetch: refetchRecent } = recent;
  const { refetch: refetchFound } = found;

  useEffect(() => input.current?.focus(), []);

  const scan = useCallback(
    async (value: string) => {
      setBusy(true);
      setError(null);
      try {
        setOutcome(await post<CheckInOutcome>(URLS.STAFF_CHECKIN, { code: value, gate }));
        refetchRecent();
        refetchFound();
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setBusy(false);
        setCode("");
        input.current?.focus();
      }
    },
    [post, gate, refetchRecent, refetchFound],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (code.trim()) scan(code.trim());
  }

  const result = outcome ? RESULT[outcome.result] : null;
  return (
    <>
      <PageHeader
        title="Check-in"
        description="Scan a pass, or type the registration ID. Hand scanners type into the box below."
      />
      <div className="row g-4">
        <div className="col-xl-7">
          <form className="adm-card p-3 mb-3" onSubmit={onSubmit}>
            <div className="row g-2">
              <div className="col">
                <input
                  ref={input}
                  className="form-control form-control-lg"
                  placeholder="Scan QR or type registration ID"
                  aria-label="Pass code or registration ID"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="col-4 col-md-3">
                <input
                  className="form-control form-control-lg"
                  placeholder="Gate"
                  aria-label="Gate"
                  value={gate}
                  onChange={(e) => setGate(e.target.value)}
                  maxLength={40}
                />
              </div>
              <div className="col-auto">
                <button className="btn btn-adm btn-lg" disabled={busy || !code.trim()}>
                  Check in
                </button>
              </div>
            </div>
          </form>
          {error && <Notice kind="danger">{error}</Notice>}

          {result && outcome ? (
            <div className={`adm-result ${result.tone}`} role="status" aria-live="polite">
              <i className={`bi bi-${result.icon}`} style={{ fontSize: 44 }} aria-hidden="true" />
              <h2>{result.title}</h2>
              {outcome.registration && (
                <>
                  <div className="fs-4 fw-bold">{outcome.registration.name}</div>
                  <div>
                    {outcome.registration.company || "—"} · {outcome.registration.category}
                  </div>
                  <div className="adm-mono mt-1" style={{ color: "rgba(255,255,255,.85)" }}>
                    {outcome.registration.public_id}
                  </div>
                </>
              )}
              {outcome.admits > 0 && (
                <div className="mt-2 fs-5">
                  {outcome.admitted} of {outcome.admits} {outcome.admits === 1 ? "person" : "people"} admitted
                  {outcome.result === "ALREADY_CHECKED_IN" && outcome.last_checked_in_at
                    ? ` · last at ${formatTime(outcome.last_checked_in_at)}`
                    : ""}
                </div>
              )}
            </div>
          ) : (
            <div className="adm-card p-5 text-center adm-muted">Waiting for a scan…</div>
          )}
        </div>

        <div className="col-xl-5 d-flex flex-column gap-3">
          <div className="adm-card">
            <div className="adm-card-head">Manual lookup</div>
            <div className="adm-card-body">
              <input
                className="form-control mb-2"
                type="search"
                placeholder="Name, company, mobile or ID"
                aria-label="Search attendees"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
              />
              {found.error && <div className="text-danger small">{found.error}</div>}
              {found.data && found.data.length === 0 && (
                <div className="adm-muted small">No confirmed registration found.</div>
              )}
              {found.data?.map((r) => (
                <div
                  className="d-flex align-items-center justify-content-between border-top py-2 gap-2"
                  key={r.public_id}
                >
                  <div className="min-w-0">
                    <div className="fw-semibold text-truncate">{r.name}</div>
                    <div className="small adm-muted text-truncate">
                      {r.company || "—"} · {r.public_id} · {r.admitted}/{r.admits ?? "?"} in
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={busy}
                    onClick={() => scan(r.public_id)}
                  >
                    Check in
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head">Recently checked in</div>
            {recent.data && recent.data.length === 0 && (
              <div className="adm-card-body adm-muted small">Nobody yet.</div>
            )}
            <ul className="list-group list-group-flush">
              {recent.data?.map((c) => (
                <li className="list-group-item d-flex justify-content-between gap-2" key={c.id}>
                  <span className="min-w-0">
                    <span className="d-block fw-semibold text-truncate">{c.registration.name}</span>
                    <span className="d-block small adm-muted text-truncate">
                      {c.registration.company || c.registration.public_id}
                      {c.gate ? ` · ${c.gate}` : ""}
                    </span>
                  </span>
                  <span className="small adm-muted text-nowrap">{formatTime(c.checked_in_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
