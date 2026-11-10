"use client";

import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

import { SITE, URL_BUILDERS } from "@/config/urls";
import { ApiError, useApi } from "@/hooks/useApi";
import type { PassResponse } from "@/types/pass";
import { buildEventCalendar } from "@/utils/calendar";
import { saveBlob } from "@/utils/staff";

import styles from "./AttendeePass.module.css";

type State = { kind: "loading" } | { kind: "ready"; pass: PassResponse } | { kind: "notFound" } | { kind: "error" };

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AttendeePass() {
  const token = useSearchParams().get("t") ?? "";
  const { get } = useApi();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    get<PassResponse>(URL_BUILDERS.pass(token))
      .then((pass) => !cancelled && setState({ kind: "ready", pass }))
      .catch((error) => {
        if (cancelled) return;
        setState({ kind: error instanceof ApiError && error.status === 404 ? "notFound" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [get, token]);

  if (!token || state.kind === "notFound") {
    return (
      <div className={styles.notice}>
        <div className="alert alert-warning" role="alert">
          <b>We could not find this pass.</b> The link may be incomplete, or it may have been replaced by a newer one.
          Please check your latest confirmation email, or contact {SITE.email}.
        </div>
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className={styles.notice}>
        <div className="alert alert-danger" role="alert">
          We could not load your pass just now. Please check your connection and reload this page.
        </div>
      </div>
    );
  }
  if (state.kind === "loading") {
    return (
      <div className={styles.notice} role="status">
        Loading your pass…
      </div>
    );
  }

  const { pass } = state;
  // The QR holds this very page's link, which is what the gate scanner reads back.
  const passLink = `${window.location.origin}/c/?t=${encodeURIComponent(token)}`;
  const people = pass.admits === 1 ? "person" : "people";
  const sameDay = formatDay(pass.event.starts_at) === formatDay(pass.event.ends_at);

  function addToCalendar() {
    saveBlob(new Blob([buildEventCalendar(pass)], { type: "text/calendar;charset=utf-8" }), `${pass.public_id}.ics`);
  }

  return (
    <div className={styles.wrap}>
      {!pass.valid && (
        <div className="alert alert-danger" role="alert">
          <b>This pass is no longer valid.</b> It was cancelled or replaced. Use the link in your latest confirmation
          email, or contact {SITE.email}.
        </div>
      )}
      <article className={styles.card} aria-label="Entry pass">
        {/* A div, not <header>: the site CSS gives every <header> display: contents. */}
        <div className={styles.head}>
          <span className={styles.eyebrow}>Entry pass</span>
          <h1>{pass.event.title}</h1>
          <small>
            {sameDay
              ? formatDay(pass.event.starts_at)
              : `${formatDay(pass.event.starts_at)} – ${formatDay(pass.event.ends_at)}`}
          </small>
          <small>{[pass.event.venue, pass.event.city].filter(Boolean).join(", ")}</small>
        </div>

        <div className={styles.body}>
          <div className={`${styles.qr} ${pass.valid ? "" : styles.qrDead}`} data-qr-value={passLink}>
            <QRCodeSVG value={passLink} size={220} level="M" title="Your entry pass QR code" />
          </div>
          <div className={styles.name}>{pass.name}</div>
          {pass.company && <div className={styles.company}>{pass.company}</div>}
          <div className={styles.meta}>
            <span className={styles.pill}>{pass.category}</span>
            <span className={`${styles.pill} ${pass.valid ? "" : styles.pillWarn}`}>
              {pass.valid ? "Valid" : "Not valid"}
            </span>
          </div>
          <div className={styles.id}>{pass.public_id}</div>
          <div className={styles.admit}>
            Admits {pass.admits} {people}
            {pass.admitted > 0 ? ` · ${pass.admitted} already checked in` : ""}
          </div>
          <p className={styles.hint}>
            Show this code at the registration desk. Keep this link private: anyone who has it can use your pass.
          </p>
        </div>

        <div className={styles.actions}>
          <button type="button" className="ai_btn" onClick={addToCalendar}>
            Add to calendar
          </button>
          <button type="button" className="ai_btn ai_btn_o" onClick={() => window.print()}>
            Print or save PDF
          </button>
        </div>
      </article>
    </div>
  );
}
