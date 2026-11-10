"use client";

import { Fragment, useEffect, useState } from "react";

import { EmptyState, FilterBar, Notice, PageHeader, Pagination, Spinner, StatusBadge } from "@/components/admin/ui";
import { URLS, URL_BUILDERS } from "@/config/urls";
import { useStaff } from "@/contexts/StaffContext";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { useStaffQuery } from "@/hooks/useStaffQuery";
import { useUrlParams } from "@/hooks/useUrlParams";
import type { EnquiryRow, Page } from "@/types/staff";
import { errorMessage, formatDateTime, hasRole, queryString } from "@/utils/staff";

const NEXT_STATUS: Record<EnquiryRow["status"], EnquiryRow["status"][]> = {
  new: ["contacted", "closed"],
  contacted: ["closed", "new"],
  closed: ["new"],
};

export default function EnquiriesPage() {
  const { user } = useStaff();
  const { patch } = useApi();
  const { params, set } = useUrlParams();
  const filters = { q: params.get("q") ?? "", status: params.get("status") ?? "" };
  const page = Number(params.get("page") ?? "1");

  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounced(search);
  useEffect(() => {
    if (debounced !== filters.q) set({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, error, loading, refetch } = useStaffQuery<Page<EnquiryRow>>(
    `${URLS.STAFF_ENQUIRIES}${queryString({ ...filters, page: page > 1 ? page : "" })}`,
  );
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const canEdit = hasRole(user, "ops");

  async function move(id: string, status: EnquiryRow["status"]) {
    setBusy(id);
    setActionError(null);
    try {
      await patch(URL_BUILDERS.staffEnquiryStatus(id), { status });
      refetch();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Enquiries" description="Messages from the contact form on the conference site" />
      <FilterBar>
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          type="search"
          placeholder="Search name, company, email…"
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
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
      </FilterBar>
      {error && <Notice kind="danger">{error}</Notice>}
      {actionError && <Notice kind="danger">{actionError}</Notice>}
      <div className="adm-card" style={{ opacity: loading ? 0.6 : 1 }}>
        {!data && loading && <Spinner />}
        {data && data.results.length === 0 && <EmptyState>No enquiries match these filters.</EmptyState>}
        {data && data.results.length > 0 && (
          <div className="adm-scroll-x">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.results.map((e) => (
                  <Fragment key={e.id}>
                    <tr className="clickable" onClick={() => setOpen(open === e.id ? null : e.id)}>
                      <td>
                        <div className="fw-semibold">{e.name || "—"}</div>
                        <div className="small adm-muted">{e.company_name}</div>
                      </td>
                      <td>
                        <a href={`mailto:${e.email}`} onClick={(ev) => ev.stopPropagation()}>
                          {e.email}
                        </a>
                        <div className="small adm-muted">{e.mobile}</div>
                      </td>
                      <td>
                        <StatusBadge value={e.status} />
                      </td>
                      <td className="small text-nowrap">{formatDateTime(e.created_at)}</td>
                      <td className="text-end">
                        <i className={`bi bi-chevron-${open === e.id ? "up" : "down"}`} aria-hidden="true" />
                      </td>
                    </tr>
                    {open === e.id && (
                      <tr>
                        <td colSpan={5} style={{ background: "#fafcfd" }}>
                          <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                            {e.message || <span className="adm-muted">No message.</span>}
                          </p>
                          {canEdit && (
                            <div className="d-flex gap-2">
                              {NEXT_STATUS[e.status].map((next) => (
                                <button
                                  key={next}
                                  className="btn btn-sm btn-outline-secondary"
                                  disabled={busy === e.id}
                                  onClick={() => move(e.id, next)}
                                >
                                  Mark as {next}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
