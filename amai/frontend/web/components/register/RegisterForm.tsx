"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

import { SITE, URLS, URL_BUILDERS } from "@/config/urls";
import { useApi } from "@/hooks/useApi";
import type { PaymentInfo, QuoteResponse } from "@/types/payment";
import type {
  RegistrationCategory,
  RegistrationErrors,
  RegistrationFormValues,
  RegistrationReceipt,
  RegistrationRequestPayload,
} from "@/types/registration";
import { DELEGATE_OPTIONS, formatMoney, priceBreakdown } from "@/utils/registration";
import { saveOrderToken } from "@/utils/orderToken";
import { openCheckout } from "@/utils/razorpay";
import { validateDetails } from "@/utils/validation";

type Step = 1 | 2 | 3;
type Alert = { kind: "success" | "danger" | "info"; text: string } | null;

const EMPTY: RegistrationFormValues = { name: "", company_name: "", mobile: "", email: "", delegates: "", message: "" };

export default function RegisterForm({ category }: { category: RegistrationCategory }) {
  const { post } = useApi();
  const [step, setStep] = useState<Step>(1);
  const [chosen, setChosen] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [values, setValues] = useState<RegistrationFormValues>(EMPTY);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [alert, setAlert] = useState<Alert>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [quoted, setQuoted] = useState<{ delegates: string; data: QuoteResponse } | null>(null);

  // Ask the server what it will actually charge, so this page and Razorpay show the same amount.
  const quoteKey = chosen ? values.delegates : "";
  useEffect(() => {
    if (!quoteKey) return;
    let cancelled = false;
    post<QuoteResponse>(URLS.REGISTRATION_QUOTE, {
      event: SITE.eventSlug,
      category: category.key,
      delegates: quoteKey,
    })
      .then((data) => !cancelled && setQuoted({ delegates: quoteKey, data }))
      .catch(() => !cancelled && setQuoted(null));
    return () => {
      cancelled = true;
    };
  }, [post, quoteKey, category.key]);
  const onlineQuote = quoted && quoted.delegates === quoteKey && quoted.data.payable_online ? quoted.data : null;

  const price = priceBreakdown(category);
  const money = (n: number) => formatMoney(n, category.currency);

  function onChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegistrationFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function goTo(target: Step) {
    if (target > step) {
      if (step === 1 && !chosen) {
        setCategoryError(true);
        return;
      }
      if (target >= 3) {
        const found = validateDetails(values);
        setErrors(found);
        if (Object.keys(found).length) return;
      }
    }
    setAlert(null);
    setStep(target);
    document.getElementById("aiSteps")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const startCheckout = useCallback(async (info: PaymentInfo) => {
    try {
      await openCheckout(info.checkout, {
        // A full page load, not a client-side transition: it works even if this tab was opened before a
        // redeploy changed the site's script file names.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full page load
        onSubmitted: () => window.location.assign(`/pay/?ref=${encodeURIComponent(info.order_ref)}`),
        onDismiss: () => undefined,
      });
    } catch {
      setAlert({
        kind: "danger",
        text: `Payment could not be opened. Use "Pay now" to try again, or email ${SITE.email} quoting your registration.`,
      });
    }
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateDetails(values);
    setErrors(found);
    if (!chosen || Object.keys(found).length) return;
    setSubmitting(true);
    try {
      const payload: RegistrationRequestPayload = { ...values, event: SITE.eventSlug, category: category.key };
      const receipt = await post<RegistrationReceipt>(URLS.REGISTRATION_REQUESTS, payload);
      if (receipt.payment) {
        saveOrderToken(receipt.payment.order_ref, receipt.payment.access_token);
        setPayment(receipt.payment);
        setAlert({
          kind: "info",
          text: `Your registration request ${receipt.public_id} is saved. Opening secure payment…`,
        });
        await startCheckout(receipt.payment);
      } else {
        setAlert({
          kind: "success",
          text: `Thank you. Your registration request ${receipt.public_id} has been submitted to the AMAI secretariat, who will contact you shortly.`,
        });
      }
    } catch {
      setAlert({
        kind: "danger",
        text: `We could not submit your registration. Please try again, or use "Send on WhatsApp" or email ${SITE.email}.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function sendOnWhatsApp() {
    const found = validateDetails(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const message =
      `Hello AMAI, I would like to register for the ${SITE.conferenceName} (${SITE.conferenceDates}).` +
      `\nCategory: ${category.label}` +
      `\nName: ${values.name}\nCompany: ${values.company_name}\nMobile: ${values.mobile}` +
      `\nEmail: ${values.email}\nDelegates: ${values.delegates}` +
      (values.message ? `\nNote: ${values.message}` : "");
    window.open(URL_BUILDERS.whatsapp(message), "_blank", "noopener");
  }

  const reviewRows: [string, string, Step][] = [
    ["Category", category.label, 1],
    ["Name", values.name, 2],
    ["Company", values.company_name, 2],
    ["Mobile", values.mobile, 2],
    ["Email", values.email, 2],
    ["Number of delegates", values.delegates, 2],
    ["Message", values.message, 2],
  ];

  const invalid = (name: keyof RegistrationFormValues) => (errors[name] ? " is-invalid" : "");

  return (
    <section className="ai_reg_top ai_bg_soft2 ai_sec">
      <div className="container">
        <Link className="ai_reg_back" href="/#register">
          <i aria-hidden="true" className="bi bi-chevron-left"></i> 12<sup>th</sup> AMAI Alkali Industry Conference 2027
        </Link>
        <div className="row g-4 g-xl-5 mt-1">
          <div className="col-lg-8 order-2 order-lg-1">
            <ol className="ai_reg_steps" id="aiSteps">
              {(["Category", "Details", "Review & submit"] as const).map((label, i) => (
                <li key={label} className={step === i + 1 ? "ai_active" : step > i + 1 ? "ai_done" : ""}>
                  <span>{i + 1}</span> {label}
                </li>
              ))}
            </ol>
            {alert && (
              <div className={`alert alert-${alert.kind}`} role="alert">
                {alert.text}
                {payment && (
                  <div className="mt-2">
                    <button className="ai_btn" type="button" onClick={() => startCheckout(payment)}>
                      Pay now {formatMoney(payment.amount_minor / 100, payment.currency)}
                    </button>
                  </div>
                )}
              </div>
            )}
            <form onSubmit={onSubmit} noValidate>
              {step === 1 && (
                <div>
                  <h1 className="ai_reg_h">Choose your registration category</h1>
                  <label className={`ai_reg_opt${chosen ? " ai_sel" : ""}`} htmlFor="aiCat">
                    <input
                      type="radio"
                      name="category"
                      id="aiCat"
                      value={category.key}
                      checked={chosen}
                      onChange={() => {
                        setChosen(true);
                        setCategoryError(false);
                      }}
                    />
                    <span className="ai_reg_opt_body">
                      <span className="ai_reg_opt_row">
                        <b>{category.title}</b>
                        <span className="ai_reg_price">
                          {money(price.base)} {category.gstRate > 0 && <small>+ GST</small>}
                        </span>
                      </span>
                      <span className="ai_reg_opt_txt">{category.description}</span>
                      {category.tag && (
                        <span className="ai_reg_tag">
                          <i aria-hidden="true" className="bi bi-patch-check"></i> {category.tag}
                        </span>
                      )}
                    </span>
                  </label>
                  {categoryError && <div className="text-danger small mt-2">Please choose a category to continue.</div>}
                  <div className="ai_reg_actions justify-content-end">
                    <button className="ai_btn" type="button" onClick={() => goTo(2)}>
                      Continue <i aria-hidden="true" className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h1 className="ai_reg_h">Delegate details</h1>
                  <p className="ai_muted">
                    Fields marked <span className="ai_reg_req">*</span> are required.
                  </p>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="aiName">
                        Name <span className="ai_reg_req">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control${invalid("name")}`}
                        id="aiName"
                        name="name"
                        placeholder="Name"
                        autoComplete="name"
                        value={values.name}
                        onChange={onChange}
                      />
                      <div className="invalid-feedback">{errors.name}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label htmlFor="aiCname">Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="aiCname"
                        name="company_name"
                        placeholder="Company name"
                        autoComplete="organization"
                        value={values.company_name}
                        onChange={onChange}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label htmlFor="aiContact">
                        Mobile Number <span className="ai_reg_req">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`form-control${invalid("mobile")}`}
                        id="aiContact"
                        name="mobile"
                        placeholder="Mobile Number"
                        autoComplete="tel"
                        inputMode="tel"
                        value={values.mobile}
                        onChange={onChange}
                      />
                      <div className="invalid-feedback">{errors.mobile}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label htmlFor="aiEmail">
                        Email Id <span className="ai_reg_req">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control${invalid("email")}`}
                        id="aiEmail"
                        name="email"
                        placeholder="Email Id"
                        autoComplete="email"
                        value={values.email}
                        onChange={onChange}
                      />
                      <div className="invalid-feedback">{errors.email}</div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label htmlFor="aiDelegates">
                        Number of Delegates <span className="ai_reg_req">*</span>
                      </label>
                      <select
                        className={`form-select${invalid("delegates")}`}
                        id="aiDelegates"
                        name="delegates"
                        value={values.delegates}
                        onChange={onChange}
                      >
                        <option value="">Number of delegates</option>
                        {DELEGATE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="invalid-feedback">{errors.delegates}</div>
                    </div>
                    <div className="col-12">
                      <label htmlFor="aiMessage">Message</label>
                      <textarea
                        className="form-control"
                        id="aiMessage"
                        name="message"
                        placeholder="Extra delegate names, special requests, etc."
                        rows={4}
                        value={values.message}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                  <div className="ai_reg_actions">
                    <button className="ai_btn ai_reg_ghost" type="button" onClick={() => goTo(1)}>
                      <i aria-hidden="true" className="bi bi-arrow-left"></i> Back
                    </button>
                    <button className="ai_btn" type="button" onClick={() => goTo(3)}>
                      Continue <i aria-hidden="true" className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h1 className="ai_reg_h">Review your registration</h1>
                  <div className="ai_reg_review">
                    <dl>
                      {reviewRows
                        .filter(([, value]) => value)
                        .map(([label, value, editStep]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                            <a
                              href="#"
                              onClick={(event) => {
                                event.preventDefault();
                                goTo(editStep);
                              }}
                            >
                              Edit
                            </a>
                          </div>
                        ))}
                      <div className="ai_reg_review_tot">
                        <dt>{onlineQuote ? "Total payable" : "Total payable (per participant)"}</dt>
                        <dd>
                          {onlineQuote
                            ? formatMoney((onlineQuote.total_minor ?? 0) / 100, category.currency)
                            : money(price.total)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="ai_reg_actions">
                    <button className="ai_btn ai_reg_ghost" type="button" onClick={() => goTo(2)}>
                      <i aria-hidden="true" className="bi bi-arrow-left"></i> Back
                    </button>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="ai_btn ai_wa_btn" type="button" onClick={sendOnWhatsApp}>
                        <i aria-hidden="true" className="bi bi-whatsapp ai_ic"></i> Send on WhatsApp
                      </button>
                      <button
                        className="ai_btn"
                        type="submit"
                        disabled={submitting || alert?.kind === "success" || payment !== null}
                      >
                        <span className="ai_reg_btn_txt">{submitting ? "Submitting…" : "Submit registration"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="col-lg-4 order-1 order-lg-2">
            <aside className="ai_reg_sum">
              <div className="ai_reg_sum_head">
                <small>You’re registering for</small>
                <h2>{SITE.conferenceName} 2027</h2>
                <span>28–29 Jan 2027 · New Delhi</span>
              </div>
              <div className="ai_reg_sum_body">
                {onlineQuote ? (
                  <>
                    <div className="ai_reg_sum_row">
                      <span>
                        {onlineQuote.delegates} × {category.label}
                      </span>
                      <span>{formatMoney((onlineQuote.subtotal_minor ?? 0) / 100, category.currency)}</span>
                    </div>
                    {(onlineQuote.discount_minor ?? 0) > 0 && (
                      <div className="ai_reg_sum_row">
                        <span>Discount ({Number(onlineQuote.discount_percent)}%)</span>
                        <span>−{formatMoney((onlineQuote.discount_minor ?? 0) / 100, category.currency)}</span>
                      </div>
                    )}
                    {(onlineQuote.gst_minor ?? 0) > 0 && (
                      <div className="ai_reg_sum_row">
                        <span>GST @{Number(onlineQuote.gst_rate)}%</span>
                        <span>{formatMoney((onlineQuote.gst_minor ?? 0) / 100, category.currency)}</span>
                      </div>
                    )}
                    <div className="ai_reg_sum_total">
                      <span>Total payable</span>
                      <span>{formatMoney((onlineQuote.total_minor ?? 0) / 100, category.currency)}</span>
                    </div>
                    <p className="ai_reg_note mb-0">
                      <i aria-hidden="true" className="bi bi-info-circle"></i> This is the amount you will be charged at
                      payment.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="ai_reg_sum_row">
                      <span>{chosen ? category.label : "Select a category"}</span>
                      <span>{chosen ? money(price.base) : "—"}</span>
                    </div>
                    {category.gstRate > 0 && (
                      <div className="ai_reg_sum_row">
                        <span>GST @{category.gstRate * 100}%</span>
                        <span>{chosen ? money(price.gst) : "—"}</span>
                      </div>
                    )}
                    <div className="ai_reg_sum_total">
                      <span>Total payable</span>
                      <span>{chosen ? money(price.total) : "—"}</span>
                    </div>
                    <p className="ai_reg_note mb-0">
                      <i aria-hidden="true" className="bi bi-info-circle"></i> Per participant. Multiple-delegate and
                      early-bird discounts are applied by AMAI.
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
