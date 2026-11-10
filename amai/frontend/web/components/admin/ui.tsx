"use client";

import { useEffect, useRef, useState } from "react";

import type { Currency } from "@/types/registration";
import { STATUS_LABEL, STATUS_TONE, formatMinor } from "@/utils/staff";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        <h1 className="h3 fw-bold mb-1">{title}</h1>
        {description && <p className="adm-muted mb-0">{description}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2 align-items-center">{actions}</div>}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "warning" | "danger";
}) {
  return (
    <div className={`adm-card adm-kpi ${tone ?? ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

const TONE_CLASS: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning text-dark",
  danger: "bg-danger",
  info: "bg-info text-dark",
  primary: "bg-primary",
  secondary: "bg-secondary",
  dark: "bg-dark",
  light: "bg-light text-dark border",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="adm-muted">—</span>;
  const tone = STATUS_TONE[value] ?? "secondary";
  return <span className={`badge ${TONE_CLASS[tone]}`}>{STATUS_LABEL[value] ?? value}</span>;
}

export function Money({ minor, currency }: { minor: number | null | undefined; currency: Currency }) {
  return <span className="text-nowrap">{formatMinor(minor, currency)}</span>;
}

export function Notice({
  kind,
  children,
}: {
  kind: "success" | "danger" | "info" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div className={`alert alert-${kind} py-2 mb-3`} role={kind === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="d-flex align-items-center gap-2 adm-muted p-4" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" /> {label}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="p-4 text-center adm-muted">{children}</div>;
}

export function Pagination({
  page,
  count,
  pageSize = 25,
  onPage,
}: {
  page: number;
  count: number;
  pageSize?: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages <= 1)
    return (
      <div className="adm-muted small p-3">
        {count} result{count === 1 ? "" : "s"}
      </div>
    );
  return (
    <div className="d-flex align-items-center justify-content-between p-3 border-top">
      <span className="adm-muted small">
        {count} results · page {page} of {pages}
      </span>
      <div className="btn-group">
        <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

/** A panel that slides in from the right. Escape and the backdrop close it. */
export function Drawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="adm-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-drawer-head">
          <div className="min-w-0">
            {subtitle && <div className="adm-mono adm-muted">{subtitle}</div>}
            <h2 className="h5 fw-bold mb-0 text-truncate">{title}</h2>
          </div>
          <button ref={closeRef} type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div className="adm-drawer-body">{children}</div>
      </aside>
    </>
  );
}

/** Asks for a short written reason (or note) before an action that should leave a record. */
export function ReasonDialog({
  title,
  label,
  submitLabel,
  danger,
  extra,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  title: string;
  label: string;
  submitLabel: string;
  danger?: boolean;
  extra?: React.ReactNode;
  busy: boolean;
  error: string | null;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <>
      <div className="adm-overlay" style={{ zIndex: 1055 }} onClick={onCancel} aria-hidden="true" />
      <form
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(event) => {
          event.preventDefault();
          if (text.trim()) onSubmit(text.trim());
        }}
      >
        <h2 className="h5 fw-bold">{title}</h2>
        {extra}
        <label className="form-label fw-semibold mt-2" htmlFor="reason">
          {label}
        </label>
        <textarea
          id="reason"
          className="form-control"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          maxLength={500}
        />
        {error && <div className="text-danger small mt-2">{error}</div>}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn ${danger ? "btn-danger" : "btn-adm"}`} disabled={busy || !text.trim()}>
            {busy ? "Working…" : submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">{children}</div>;
}
