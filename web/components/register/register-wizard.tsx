"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Lock, Pencil, ShieldQuestion, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button, Card, Spinner } from "@/components/ui/primitives";
import { Field, FieldError, Select } from "@/components/ui/field";
import { Chip } from "@/components/ui/status";
import { formatDate, formatDateRange, formatINR } from "@/lib/format";
import { ApiError, createRegistration, verifyMember, type MemberCheck } from "@/lib/mock/api";
import { quote, seatsLeft } from "@/lib/pricing";
import type { AmaiEvent, TicketCategory } from "@/lib/types";

import { detailsSchema, INDIAN_STATES, type Details } from "./schema";

const STEPS = ["Category", "Details", "Review", "Pay"] as const;

export function RegisterWizard({ event }: { event: AmaiEvent }) {
  const router = useRouter();
  const search = useSearchParams();
  const [step, setStep] = useState(0);
  // A fee card on the microsite links here with ?category=<id> to preselect it.
  const [categoryId, setCategoryId] = useState<string | null>(() => {
    const preset = search.get("category");
    return event.categories.some((c) => c.id === preset) ? preset : null;
  });
  const [memberId, setMemberId] = useState("");
  const [memberCheck, setMemberCheck] = useState<MemberCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const category = event.categories.find((c) => c.id === categoryId) ?? null;
  const q = useMemo(() => (category ? quote(category) : null), [category]);
  const isMember = category?.audience === "MEMBER";

  const draftKey = `amai-draft-${event.slug}`;
  const form = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      organisation: "",
      designation: "",
      city: "",
      state: "",
      billingName: "",
      gstin: "",
      consentTransactional: undefined as unknown as true,
      consentMarketing: false,
    },
  });
  const { register, handleSubmit, formState, watch, setValue, getValues } = form;
  const errors = formState.errors;

  // Restore / persist the draft for this tab only (never payment data).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) form.reset({ ...getValues(), ...JSON.parse(raw) });
    } catch {}
    const sub = watch((v) => {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(v));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [draftKey, form, getValues, watch]);

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const canLeaveCategory =
    !!category && (!isMember || (memberCheck !== null && memberCheck.status !== "REJECTED"));

  async function runMemberCheck() {
    if (!memberId.trim()) return;
    setChecking(true);
    setMemberCheck(null);
    const res = await verifyMember(memberId);
    setMemberCheck(res);
    setChecking(false);
    if (res.organisation) {
      if (!getValues("organisation")) setValue("organisation", res.organisation);
      if (!getValues("billingName")) setValue("billingName", res.organisation);
    }
    if (memberId.includes("@") && !getValues("email")) setValue("email", memberId.trim());
  }

  async function pay() {
    if (!category) return;
    setSubmitting(true);
    setSubmitError(null);
    const d = getValues();
    try {
      const { orderRef } = await createRegistration({
        eventSlug: event.slug,
        categoryId: category.id,
        audience: category.audience,
        memberValidation: isMember ? memberCheck!.status : "NOT_REQUIRED",
        memberIdentifier: isMember ? memberId.trim() : undefined,
        person: {
          fullName: d.fullName,
          email: d.email.toLowerCase(),
          mobile: `+91 ${d.mobile}`,
          organisation: d.organisation,
          designation: d.designation,
          city: d.city,
          state: d.state,
        },
        billing: { billingName: d.billingName, gstin: d.gstin || undefined, state: d.state },
        consentMarketing: d.consentMarketing,
        utmSource: search.get("utm_source") ?? undefined,
      });
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
      router.push(`/gateway/${orderRef}`);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="min-w-0">
        <Stepper step={step} />

        {/* STEP 1: Category */}
        {step === 0 && (
          <section aria-labelledby="step-title" className="animate-rise">
            <StepTitle ref={headingRef}>Choose your registration category</StepTitle>
            <fieldset>
              <legend className="sr-only">Registration category</legend>
              <div className="grid gap-3">
                {event.categories.map((c) => (
                  <CategoryCard
                    key={c.id}
                    category={c}
                    selected={categoryId === c.id}
                    onSelect={() => {
                      setCategoryId(c.id);
                      setMemberCheck(null);
                    }}
                  />
                ))}
              </div>
            </fieldset>

            {isMember && (
              <Card className="mt-5 p-5">
                <h3 className="font-semibold text-ink-900">Verify your membership</h3>
                <p className="mt-1 text-sm text-ink-500">
                  Enter your AMAI member number or your work email at a member company.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Field
                    label="Member number or work email"
                    placeholder="AMAI-M-0011 or name@company.com"
                    value={memberId}
                    onChange={(e) => {
                      setMemberId(e.target.value);
                      setMemberCheck(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runMemberCheck())}
                    className="flex-1"
                    autoComplete="email"
                  />
                  <Button type="button" variant="secondary" onClick={runMemberCheck} loading={checking} disabled={!memberId.trim()}>
                    Verify
                  </Button>
                </div>
                <p className="mt-2 text-xs text-ink-400">
                  Try <code className="font-mono">AMAI-M-0011</code>, <code className="font-mono">you@dcmshriram.com</code>, a lapsed
                  member <code className="font-mono">AMAI-M-0015</code>, or anything else to trigger manual review.
                </p>
                {memberCheck && <MemberResult check={memberCheck} onSwitch={() => {
                  const nm = event.categories.find((c) => c.audience === "NON_MEMBER");
                  if (nm) setCategoryId(nm.id);
                  setMemberCheck(null);
                }} />}
              </Card>
            )}

            <StepNav>
              <span />
              <Button type="button" size="lg" disabled={!canLeaveCategory} onClick={() => setStep(1)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </StepNav>
          </section>
        )}

        {/* STEP 2: Details */}
        {step === 1 && (
          <form
            aria-labelledby="step-title"
            className="animate-rise"
            noValidate
            onSubmit={handleSubmit(() => setStep(2))}
          >
            <StepTitle ref={headingRef}>Your details</StepTitle>
            {Object.keys(errors).length > 1 && formState.isSubmitted && (
              <div role="alert" className="mb-5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-bg p-4 text-sm text-danger">
                Please fix the {Object.keys(errors).length} highlighted fields.
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" autoComplete="name" className="sm:col-span-2" error={errors.fullName?.message} {...register("fullName")} />
              <Field label="Email" type="email" autoComplete="email" inputMode="email" hint="Your confirmation and QR pass go here" error={errors.email?.message} {...register("email")} />
              <Field label="Mobile" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} prefix="+91" hint="For SMS confirmation" error={errors.mobile?.message} {...register("mobile")} />
              <Field label="Organisation" autoComplete="organization" error={errors.organisation?.message} {...register("organisation")} />
              <Field label="Designation" autoComplete="organization-title" error={errors.designation?.message} {...register("designation")} />
              <Field label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
              <Select label="State" error={errors.state?.message} {...register("state")}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>

            <h3 className="mt-9 mb-4 font-semibold text-ink-900">GST invoice</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Invoice in the name of" error={errors.billingName?.message} {...register("billingName")} />
              <Field
                label="GSTIN"
                optional
                placeholder="27AAACT1234F1Z5"
                className="uppercase-input"
                hint="Add it to claim input tax credit"
                error={errors.gstin?.message}
                {...register("gstin", { setValueAs: (v: string) => v.toUpperCase().trim() })}
              />
            </div>

            <div className="mt-9 space-y-4">
              <Checkbox error={errors.consentTransactional?.message} {...register("consentTransactional")}>
                I agree to receive my registration confirmation, invoice, QR pass and event updates by email and SMS.
              </Checkbox>
              <Checkbox {...register("consentMarketing")}>
                <span>
                  Send me news about future AMAI events and publications <span className="text-ink-500">(optional)</span>
                </span>
              </Checkbox>
            </div>

            <StepNav>
              <Button type="button" variant="tertiary" onClick={() => setStep(0)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button type="submit" size="lg">
                Review <ArrowRight className="size-4" />
              </Button>
            </StepNav>
          </form>
        )}

        {/* STEP 3: Review */}
        {step === 2 && category && q && (
          <section aria-labelledby="step-title" className="animate-rise">
            <StepTitle ref={headingRef}>Review and confirm</StepTitle>
            <Card className="divide-y divide-line-200">
              <ReviewBlock title="Category" onEdit={() => setStep(0)}>
                <p className="font-medium text-ink-900">{category.name}</p>
                {isMember && memberCheck && (
                  <p className="mt-1 text-sm text-ink-500">
                    Membership: {memberCheck.status === "VERIFIED" ? `verified (${memberCheck.organisation})` : "to be verified by the secretariat"}
                  </p>
                )}
              </ReviewBlock>
              <ReviewBlock title="Attendee" onEdit={() => setStep(1)}>
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {(
                    [
                      ["Name", getValues("fullName")],
                      ["Email", getValues("email")],
                      ["Mobile", `+91 ${getValues("mobile")}`],
                      ["Organisation", getValues("organisation")],
                      ["Designation", getValues("designation")],
                      ["Location", `${getValues("city")}, ${getValues("state")}`],
                      ["Invoice to", getValues("billingName")],
                      ["GSTIN", getValues("gstin") || "Not provided"],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-ink-500">{k}</dt>
                      <dd className="truncate font-medium text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </ReviewBlock>
            </Card>

            <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-brand-blue-600"
              />
              <span>
                I accept the <a href="#" className="text-brand-blue-600 underline">terms</a> and{" "}
                <a href="#" className="text-brand-blue-600 underline">cancellation & refund policy</a>.
              </span>
            </label>

            {submitError && (
              <div role="alert" className="mt-5 flex gap-2 rounded-[var(--radius-control)] border border-danger/30 bg-danger-bg p-4 text-sm text-danger">
                <XCircle className="size-5 shrink-0" /> {submitError}
              </div>
            )}

            <StepNav>
              <Button type="button" variant="tertiary" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button type="button" size="lg" disabled={!agree} loading={submitting} onClick={pay}>
                <Lock className="size-4" /> Pay {formatINR(q.totalPaise)}
              </Button>
            </StepNav>
            <p className="mt-3 text-right text-xs text-ink-500">
              You’ll complete payment on the gateway’s secure page. AMAI never sees your card or UPI details.
            </p>
          </section>
        )}
      </div>

      {/* Summary: sidebar on desktop, sticky bar on mobile */}
      <aside className="hidden lg:block">
        <div className="sticky top-36">
          <Summary event={event} category={category} />
        </div>
      </aside>
      {category && q && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgb(16_24_40/.08)] backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-ink-500">{category.name} · incl. GST</p>
              <p className="tnum text-lg font-semibold text-ink-900">{formatINR(q.totalPaise)}</p>
            </div>
            <span className="text-xs text-ink-500">Step {step + 1} of 4</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- pieces ---------- */

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Registration progress">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={current ? "step" : undefined}>
            <span
              className={clsx(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                done && "bg-brand-blue-600 text-white",
                current && "bg-brand-blue-600 text-white ring-4 ring-brand-blue-100",
                !done && !current && "bg-surface-100 text-ink-500 ring-1 ring-line-200",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={clsx("hidden text-sm sm:inline", current ? "font-semibold text-ink-900" : "text-ink-500")}>{label}</span>
            {i < STEPS.length - 1 && (
              <span className={clsx("h-0.5 flex-1 rounded", done ? "bg-brand-blue-600" : "bg-line-200")} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepTitle({ children, ref }: { children: React.ReactNode; ref: React.Ref<HTMLHeadingElement> }) {
  return (
    <h2 id="step-title" ref={ref} tabIndex={-1} className="mb-6 text-[26px] font-extrabold outline-none">
      {children}
    </h2>
  );
}

function StepNav({ children }: { children: React.ReactNode }) {
  return <div className="mt-9 flex items-center justify-between gap-3 border-t border-line-200 pt-6">{children}</div>;
}

function CategoryCard({ category, selected, onSelect }: { category: TicketCategory; selected: boolean; onSelect: () => void }) {
  const left = seatsLeft(category);
  const soldOut = left === 0;
  const q = quote(category);
  return (
    <label
      className={clsx(
        "relative flex cursor-pointer gap-4 rounded-[var(--radius-card)] border-2 p-4 transition-colors sm:p-5",
        soldOut && "cursor-not-allowed opacity-60",
        selected ? "border-brand-blue-600 bg-brand-blue-50" : "border-line-200 hover:border-brand-blue-100",
      )}
    >
      <input
        type="radio"
        name="category"
        className="mt-1 size-5 shrink-0 accent-brand-blue-600"
        checked={selected}
        disabled={soldOut}
        onChange={onSelect}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <span className="font-semibold text-ink-900">{category.name}</span>
          <span className="tnum font-semibold text-ink-900">
            {formatINR(q.taxablePaise)} <span className="text-xs font-normal text-ink-500">+ GST</span>
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-500">{category.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {category.requiresMemberValidation && <Chip tone="info" icon={BadgeCheck}>Membership check</Chip>}
          {q.earlyBird && <Chip tone="info">Early bird till {formatDate(category.earlyBirdUntil!)}</Chip>}
          {soldOut ? <Chip tone="danger">Sold out</Chip> : left !== null && left <= 10 && <Chip tone="warning">{left} seats left</Chip>}
        </div>
      </div>
    </label>
  );
}

function MemberResult({ check, onSwitch }: { check: MemberCheck; onSwitch: () => void }) {
  const styles = {
    VERIFIED: { cls: "border-success/30 bg-success-bg text-success", Icon: BadgeCheck },
    PENDING_REVIEW: { cls: "border-warning/30 bg-warning-bg text-warning", Icon: ShieldQuestion },
    REJECTED: { cls: "border-danger/30 bg-danger-bg text-danger", Icon: XCircle },
    NOT_REQUIRED: { cls: "", Icon: Check },
  }[check.status];
  return (
    <div role="status" className={clsx("mt-4 flex gap-3 rounded-[var(--radius-control)] border p-4 text-sm", styles.cls)}>
      <styles.Icon className="size-5 shrink-0" aria-hidden />
      <div>
        <p>{check.message}</p>
        {check.status === "REJECTED" && (
          <button type="button" onClick={onSwitch} className="mt-2 font-semibold underline">
            Switch to non-member registration
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-ink-500 uppercase">{title}</h3>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue-600 hover:underline">
          <Pencil className="size-3.5" /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

const Checkbox = function Checkbox({
  children,
  error,
  ...rest
}: React.ComponentProps<"input"> & { error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-700">
        <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-brand-blue-600" aria-invalid={!!error} {...rest} />
        <span>{children}</span>
      </label>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
};

function Summary({ event, category }: { event: AmaiEvent; category: TicketCategory | null }) {
  const q = category ? quote(category) : null;
  return (
    <Card className="overflow-hidden">
      <div className="bg-brand-indigo-600 p-5 text-white">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-80">You’re registering for</p>
        <p className="mt-1 text-lg leading-snug font-extrabold">{event.title}</p>
        <p className="mt-1 text-sm opacity-85">
          {formatDateRange(event.startsAt, event.endsAt)} · {event.city}
        </p>
      </div>
      <div className="p-5">
        {!category || !q ? (
          <p className="text-sm text-ink-500">Choose a category to see the fee breakdown.</p>
        ) : (
          <dl className="tnum space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">{category.name}</dt>
              <dd className="text-ink-900">{formatINR(q.taxablePaise)}</dd>
            </div>
            {q.earlyBird && (
              <div className="flex justify-between gap-4 text-success">
                <dt>Early bird saving</dt>
                <dd>− {formatINR(category.baseAmountPaise - q.taxablePaise)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">GST @ {q.gstRate}%</dt>
              <dd className="text-ink-900">{formatINR(q.gstPaise)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line-200 pt-3 text-base font-semibold">
              <dt className="text-ink-900">Total payable</dt>
              <dd className="text-ink-900">{formatINR(q.totalPaise)}</dd>
            </div>
          </dl>
        )}
        <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
          <Lock className="size-3.5" aria-hidden /> Price is set by AMAI’s server, not your browser.
        </p>
      </div>
    </Card>
  );
}

export function WizardFallback() {
  return (
    <div className="flex items-center gap-3 py-20 text-ink-500">
      <Spinner /> Loading registration…
    </div>
  );
}
