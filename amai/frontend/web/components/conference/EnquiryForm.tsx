"use client";

import { FormEvent, useState } from "react";

import { SITE, URLS } from "@/config/urls";
import { useApi } from "@/hooks/useApi";
import type { EnquiryPayload } from "@/types/registration";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "success" } | { kind: "error" };

export function EnquiryForm() {
  const { post } = useApi();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: EnquiryPayload = {
      name: String(data.get("name") ?? ""),
      company_name: String(data.get("company_name") ?? ""),
      mobile: String(data.get("mobile") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
    };
    setStatus({ kind: "sending" });
    try {
      await post(URLS.ENQUIRIES, payload);
      setStatus({ kind: "success" });
      form.reset();
    } catch {
      setStatus({ kind: "error" });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        <div className="col-12 col-sm-6">
          <label htmlFor="enqName">Name</label>
          <input id="enqName" type="text" className="form-control" placeholder="Name" name="name" autoComplete="name" />
        </div>
        <div className="col-12 col-sm-6">
          <label htmlFor="enqCname">Company Name</label>
          <input
            id="enqCname"
            type="text"
            className="form-control"
            placeholder="Company name"
            name="company_name"
            autoComplete="organization"
          />
        </div>
        <div className="col-12 col-sm-6">
          <label htmlFor="enqContact">Mobile Number</label>
          <input
            id="enqContact"
            type="tel"
            className="form-control"
            placeholder="Mobile Number"
            name="mobile"
            autoComplete="tel"
            required
          />
        </div>
        <div className="col-12 col-sm-6">
          <label htmlFor="enqEmail">Email Id</label>
          <input
            id="enqEmail"
            type="email"
            className="form-control"
            placeholder="Email Id"
            name="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="col-12">
          <label htmlFor="enqMessage">Any Additional Requirements</label>
          <textarea
            id="enqMessage"
            className="form-control"
            placeholder="Extra delegate names, special requests, etc."
            name="message"
            rows={3}
          />
        </div>
        {/* Honeypot: hidden from people, filled by bots. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
          <label htmlFor="enqWebsite">Website</label>
          <input id="enqWebsite" type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {status.kind === "success" && (
          <div className="col-12">
            <div className="alert alert-success mb-0" role="status">
              Thank you. Our team will get back to you shortly.
            </div>
          </div>
        )}
        {status.kind === "error" && (
          <div className="col-12">
            <div className="alert alert-danger mb-0" role="alert">
              We could not send your message. Please email {SITE.email} instead.
            </div>
          </div>
        )}
        <div className="col-12">
          <button className="ai_btn w-100" type="submit" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Sending…" : "Send Message"}
          </button>
        </div>
      </div>
    </form>
  );
}
