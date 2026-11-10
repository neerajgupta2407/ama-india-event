"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
import { useDebounced } from "@/hooks/useDebounced";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import { useUrlParams } from "@/hooks/useUrlParams";
import type { OrderRow, Page } from "@/types/staff";
import { formatDateTime, queryString } from "@/utils/staff";

export default function PaymentsPage() {
  const { params, set } = useUrlParams();
  const filters = {
    q: params.get("q") ?? "",
    status: params.get("status") ?? "",
    stale: params.get("stale") === "true",
  };
  const page = Number(params.get("page") ?? "1");

  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounced(search);
  useEffect(() => {
    if (debounced !== filters.q) set({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading } = useStaffQuery<Page<OrderRow>>(
    `${URLS.STAFF_ORDERS}${queryString({ ...filters, page: page > 1 ? page : "" })}`,
  );

  return (
    <>
      <PageHeader title="Payments" description="Every online payment order and what happened to it" />
      <FilterBar>
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          type="search"
          placeholder="Search order, registration, name…"
          aria-label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: "auto" }}
          aria-label="Status"
          value={filters.status}
          onChange={(e) => set({ status: e.target.value || null })}
        >
          <option value="">Any status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="mismatch">Mismatch</option>
        </select>
        <div className="form-check mb-0">
          <input
            id="stale"
            className="form-check-input"
            type="checkbox"
            checked={filters.stale}
            onChange={(e) => set({ stale: e.target.checked ? "true" : null })}
          />
          <label className="form-check-label" htmlFor="stale">
            Pending over an hour
          </label>
        </div>
      </FilterBar>
      {error && <Notice kind="danger">{error}</Notice>}
      <div className="adm-card" style={{ opacity: loading ? 0.6 : 1 }}>
        {!data && loading && <Spinner />}
        {data && data.results.length === 0 && <EmptyState>No payments match these filters.</EmptyState>}
        {data && data.results.length > 0 && (
          <div className="adm-scroll-x">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Attendee</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                  <th>Attempts</th>
                  <th>Created</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((o) => (
                  <tr key={o.reference}>
                    <td>
                      <Link className="adm-mono" href={`/dashboard/registrations/?id=${o.registration}`}>
                        {o.reference}
                      </Link>
                      <div className="small adm-muted">{o.registration}</div>
                    </td>
                    <td>
                      <div className="fw-semibold">{o.name}</div>
                      <div className="small adm-muted">{o.company || o.email}</div>
                    </td>
                    <td>
                      <StatusBadge value={o.status} />
                      {o.last_error && <div className="small text-danger mt-1">{o.last_error}</div>}
                    </td>
                    <td className="num">
                      <Money minor={o.amount_minor} currency={o.currency} />
                    </td>
                    <td>{o.attempts}</td>
                    <td className="small text-nowrap">{formatDateTime(o.created_at)}</td>
                    <td className="small text-nowrap">{formatDateTime(o.paid_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={page} count={data.count} onPage={(p) => set({ page: String(p) })} />}
      </div>
    </>
  );
}
