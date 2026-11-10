"use client";

import { FormEvent, useState } from "react";

import { EmptyState, Money, Notice, PageHeader, Spinner, StatusBadge } from "@/components/admin/ui";
import { URLS, URL_BUILDERS } from "@/config/urls";
import { useStaff } from "@/contexts/StaffContext";
import { useApi } from "@/hooks/useApi";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import type { StaffCategory, StaffEvent } from "@/types/staff";
import { errorMessage, formatDateTime, hasRole } from "@/utils/staff";

/** ISO timestamp -> value for <input type="datetime-local">, in the browser's own zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const toIso = (local: string): string | null => (local ? new Date(local).toISOString() : null);

export default function EventsPage() {
  const { data, error, loading, refetch } = useStaffQuery<StaffEvent[]>(URLS.STAFF_EVENTS);
  return (
    <>
      <PageHeader title="Events & fees" description="Prices, discount rules and whether people can pay online" />
      {error && <Notice kind="danger">{error}</Notice>}
      {!data && loading && <Spinner />}
      {data && data.length === 0 && <EmptyState>No events yet.</EmptyState>}
      {data?.map((event) => (
        <EventCard key={event.slug} event={event} onSaved={refetch} />
      ))}
    </>
  );
}

function EventCard({ event, onSaved }: { event: StaffEvent; onSaved: () => void }) {
  const { user } = useStaff();
  const { patch } = useApi();
  const canEdit = hasRole(user, "event_admin");
  const [form, setForm] = useState({
    status: event.status,
    registration_opens_at: toLocalInput(event.registration_opens_at),
    registration_closes_at: toLocalInput(event.registration_closes_at),
    online_payment_enabled: event.online_payment_enabled,
    early_bird_percent: event.early_bird_percent,
    early_bird_until: toLocalInput(event.early_bird_until),
    group_discount_percent: event.group_discount_percent,
    group_min_delegates: String(event.group_min_delegates),
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "danger"; text: string } | null>(null);
  const change = (patchValues: Partial<typeof form>) => setForm((f) => ({ ...f, ...patchValues }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await patch(URL_BUILDERS.staffEventSettings(event.slug), {
        status: form.status,
        registration_opens_at: toIso(form.registration_opens_at),
        registration_closes_at: toIso(form.registration_closes_at),
        online_payment_enabled: form.online_payment_enabled,
        early_bird_percent: form.early_bird_percent || "0",
        early_bird_until: toIso(form.early_bird_until),
        group_discount_percent: form.group_discount_percent || "0",
        group_min_delegates: Number(form.group_min_delegates),
      });
      setNotice({ kind: "success", text: "Settings saved." });
      onSaved();
    } catch (caught) {
      setNotice({ kind: "danger", text: errorMessage(caught) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-card mb-4">
      <div className="adm-card-head">
        <span>
          {event.title} <span className="adm-muted fw-normal">· {event.registrations} registrations</span>
        </span>
        <StatusBadge value={event.status} />
      </div>
      <div className="adm-card-body">
        <p className="adm-muted small">
          {formatDateTime(event.starts_at)} – {formatDateTime(event.ends_at)} · {event.venue}, {event.city} · IDs start
          AMAI-{event.registration_prefix}-
        </p>
        {!canEdit && <Notice kind="info">Only event administrators can change these settings.</Notice>}
        {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

        <form onSubmit={save}>
          <fieldset disabled={!canEdit || busy}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold" htmlFor={`status-${event.slug}`}>
                  Registration
                </label>
                <select
                  id={`status-${event.slug}`}
                  className="form-select"
                  value={form.status}
                  onChange={(e) => change({ status: e.target.value as StaffEvent["status"] })}
                >
                  <option value="draft">Draft (hidden)</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Opens</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.registration_opens_at}
                  onChange={(e) => change({ registration_opens_at: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Closes</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.registration_closes_at}
                  onChange={(e) => change({ registration_closes_at: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Early-bird discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className="form-control"
                  value={form.early_bird_percent}
                  onChange={(e) => change({ early_bird_percent: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Early-bird ends</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.early_bird_until}
                  onChange={(e) => change({ early_bird_until: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Group discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className="form-control"
                  value={form.group_discount_percent}
                  onChange={(e) => change({ group_discount_percent: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Group means at least</label>
                <input
                  type="number"
                  min={2}
                  className="form-control"
                  value={form.group_min_delegates}
                  onChange={(e) => change({ group_min_delegates: e.target.value })}
                />
              </div>

              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    id={`pay-${event.slug}`}
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={form.online_payment_enabled}
                    onChange={(e) => change({ online_payment_enabled: e.target.checked })}
                  />
                  <label className="form-check-label fw-semibold" htmlFor={`pay-${event.slug}`}>
                    Let people pay online
                  </label>
                </div>
                <div className="small adm-muted">
                  The two discounts add together. When this is off, registrations are saved and the secretariat follows
                  up. Changes apply to new registrations only.
                </div>
              </div>
            </div>
            {canEdit && (
              <button className="btn btn-adm mt-3" type="submit">
                {busy ? "Saving…" : "Save settings"}
              </button>
            )}
          </fieldset>
        </form>

        <h3 className="h6 fw-bold mt-4">Fees</h3>
        <div className="adm-scroll-x">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Fee per person</th>
                <th className="num">GST %</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {event.categories.map((category) => (
                <CategoryRow key={category.id} category={category} canEdit={canEdit} onSaved={onSaved} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  canEdit,
  onSaved,
}: {
  category: StaffCategory;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const { patch } = useApi();
  const [fee, setFee] = useState(String(category.base_amount_minor / 100));
  const [gst, setGst] = useState(category.gst_rate);
  const [active, setActive] = useState(category.is_active);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty =
    Math.round(Number(fee) * 100) !== category.base_amount_minor ||
    gst !== category.gst_rate ||
    active !== category.is_active;

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await patch(URL_BUILDERS.staffCategory(category.id), {
        base_amount_minor: Math.round(Number(fee) * 100),
        gst_rate: gst,
        is_active: active,
      });
      setMessage({ ok: true, text: "Saved" });
      onSaved();
    } catch (caught) {
      setMessage({ ok: false, text: errorMessage(caught) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td>
        <div className="fw-semibold">{category.name}</div>
        <div className="small adm-muted">
          {category.audience.replace("_", "-")} · {category.currency}
        </div>
      </td>
      <td className="num" style={{ width: 170 }}>
        <input
          type="number"
          min={1}
          step="0.01"
          className="form-control form-control-sm text-end"
          aria-label={`Fee for ${category.name}`}
          value={fee}
          disabled={!canEdit || busy}
          onChange={(e) => setFee(e.target.value)}
        />
        <div className="small adm-muted mt-1">
          now <Money minor={category.base_amount_minor} currency={category.currency} />
        </div>
      </td>
      <td className="num" style={{ width: 110 }}>
        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          className="form-control form-control-sm text-end"
          aria-label={`GST for ${category.name}`}
          value={gst}
          disabled={!canEdit || busy}
          onChange={(e) => setGst(e.target.value)}
        />
      </td>
      <td>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            aria-label={`${category.name} active`}
            checked={active}
            disabled={!canEdit || busy}
            onChange={(e) => setActive(e.target.checked)}
          />
        </div>
      </td>
      <td className="text-end">
        {canEdit && (
          <button className="btn btn-sm btn-adm" disabled={!dirty || busy} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </button>
        )}
        {message && <div className={`small ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</div>}
      </td>
    </tr>
  );
}
