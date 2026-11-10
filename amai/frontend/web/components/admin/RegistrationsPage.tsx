"use client";

import { useEffect, useState } from "react";

import RegistrationDrawer from "@/components/admin/RegistrationDrawer";
import {
  EmptyState,
  FilterBar,
  Money,
  Notice,
  PageHeader,
  Pagination,
  Spinner,
  StatusBadge,
} from "@/components/admin/ui";
import { URLS } from "@/config/urls";
import { useStaff } from "@/contexts/StaffContext";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import { useUrlParams } from "@/hooks/useUrlParams";
import type { Overview, Page, RegistrationRow } from "@/types/staff";
import { errorMessage, formatDateTime, hasRole, queryString, saveBlob } from "@/utils/staff";

export default function RegistrationsPage() {
  const { user } = useStaff();
  const { download } = useApi();
  const { params, set } = useUrlParams();
  const filters = {
    q: params.get("q") ?? "",
    status: params.get("status") ?? "",
    payment_status: params.get("payment_status") ?? "",
    member_validation: params.get("member_validation") ?? "",
    event: params.get("event") ?? "",
  };
  const page = Number(params.get("page") ?? "1");
  const openId = params.get("id");

  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounced(search);
  useEffect(() => {
    if (debounced !== filters.q) set({ q: debounced || null });
    // `set` changes with the URL; only the typed text should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const list = useStaffQuery<Page<RegistrationRow>>(
    `${URLS.STAFF_REGISTRATIONS}${queryString({ ...filters, page: page > 1 ? page : "" })}`,
  );
  const overview = useStaffQuery<Overview>(URLS.STAFF_OVERVIEW);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function exportCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const { blob, filename } = await download(`${URLS.STAFF_REGISTRATIONS_EXPORT}${queryString(filters)}`);
      saveBlob(blob, filename);
    } catch (caught) {
      setExportError(errorMessage(caught));
    } finally {
      setExporting(false);
    }
  }

  const select = (key: keyof typeof filters, label: string, options: [string, string][]) => (
    <select
      className="form-select"
      style={{ width: "auto" }}
      aria-label={label}
      value={filters[key]}
      onChange={(e) => set({ [key]: e.target.value || null })}
    >
      <option value="">{label}</option>
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Everyone who has registered, with their payment and membership status"
        actions={
          hasRole(user, "ops", "finance") ? (
            <button className="btn btn-outline-secondary" onClick={exportCsv} disabled={exporting}>
              <i className="bi bi-download" aria-hidden="true" /> {exporting ? "Preparing…" : "Export CSV"}
            </button>
          ) : undefined
        }
      />
      {exportError && <Notice kind="danger">{exportError}</Notice>}
      <FilterBar>
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          type="search"
          placeholder="Search name, email, company, ID, order…"
          aria-label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {select(
          "event",
          "All events",
          (overview.data?.events ?? []).map((e) => [e.slug, e.title]),
        )}
        {select("status", "Any status", [
          ["requested", "Requested"],
          ["pending_payment", "Awaiting payment"],
          ["confirmed", "Confirmed"],
          ["cancelled", "Cancelled"],
        ])}
        {select("payment_status", "Any payment", [
          ["paid", "Paid"],
          ["pending", "Pending"],
          ["failed", "Failed"],
          ["mismatch", "Mismatch"],
        ])}
        {select("member_validation", "Any membership", [
          ["pending_review", "Needs review"],
          ["verified", "Verified"],
          ["rejected", "Rejected"],
        ])}
      </FilterBar>

      {list.error && <Notice kind="danger">{list.error}</Notice>}
      <div className="adm-card" style={{ opacity: list.loading ? 0.6 : 1 }}>
        {!list.data && list.loading && <Spinner />}
        {list.data && list.data.results.length === 0 && <EmptyState>No registrations match these filters.</EmptyState>}
        {list.data && list.data.results.length > 0 && (
          <div className="adm-scroll-x">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Attendee</th>
                  <th>Category</th>
                  <th>Membership</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="num">Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {list.data.results.map((r) => (
                  <tr key={r.id} className="clickable" onClick={() => set({ id: r.public_id })}>
                    <td>
                      <button
                        className="btn btn-link p-0 adm-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          set({ id: r.public_id });
                        }}
                      >
                        {r.public_id}
                      </button>
                    </td>
                    <td>
                      <div className="fw-semibold">{r.full_name}</div>
                      <div className="small adm-muted">{r.company_name || r.email}</div>
                    </td>
                    <td>
                      {r.category_name}
                      <div className="small adm-muted">
                        {r.delegates} delegate{r.delegates === "1" ? "" : "s"}
                      </div>
                    </td>
                    <td>
                      <StatusBadge value={r.member_validation} />
                    </td>
                    <td>
                      <StatusBadge value={r.status} />
                    </td>
                    <td>
                      <StatusBadge value={r.payment_status} />
                    </td>
                    <td className="num">
                      {r.order_amount_minor !== null ? (
                        <Money minor={r.order_amount_minor} currency={r.currency} />
                      ) : (
                        <span className="adm-muted">
                          <Money minor={r.quoted_total_minor} currency={r.currency} /> pp
                        </span>
                      )}
                    </td>
                    <td className="small text-nowrap">{formatDateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data && <Pagination page={page} count={list.data.count} onPage={(p) => set({ page: String(p) })} />}
      </div>

      {openId && <RegistrationDrawer publicId={openId} onClose={() => set({ id: null })} onChanged={list.refetch} />}
    </>
  );
}
