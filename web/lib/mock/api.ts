"use client";

// Browser-only mock of the Django API (IMPLEMENTATION.md §9). Every function is async and
// returns the same shape the real endpoint will, so pages switch over by replacing this module.
// State lives in localStorage; the seed is rebuilt on each load and local edits are layered on top.
import { useSyncExternalStore } from "react";

import { quote } from "../pricing";
import type { Audience, MemberValidation, OrderStatus, PaymentAttempt, Registration } from "../types";
import { getEvent, MEMBER_ORGS } from "./data";
import { buildSeed } from "./seed";

const KEY = "amai-demo-v1";
const CHANGE = "amai-demo-change";
const WEBHOOK_DELAY_MS = 3500;
const LATENCY_MS = 450;

type Store = { registrations: Record<string, Registration> };

const wait = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // private mode or corrupted JSON; fall through to an empty store
  }
  return { registrations: {} };
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // quota or blocked storage; the demo still works for this page view
  }
  // Async so a write that happens while a component reads the store never notifies mid-render.
  setTimeout(() => window.dispatchEvent(new Event(CHANGE)), 0);
}

let seedCache: Registration[] | null = null;
const seed = () => (seedCache ??= buildSeed());

function all(): Registration[] {
  const local = readStore().registrations;
  const merged = new Map(seed().map((r) => [r.publicId, r]));
  for (const r of Object.values(local)) merged.set(r.publicId, r);
  return [...merged.values()].map(settle).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function save(reg: Registration) {
  const store = readStore();
  store.registrations[reg.publicId] = reg;
  writeStore(store);
}

const now = () => new Date().toISOString();
const randomToken = (bytes = 18) => {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const randomRef = () => `ORD-${randomToken(6).toUpperCase().replace(/[-_]/g, "X").slice(0, 8)}`;

// Applies a simulated webhook once its delay has elapsed (the real system does this in Celery).
function settle(reg: Registration): Registration {
  const pending = reg.order.pendingOutcome;
  if (!pending || Date.now() < pending.resolveAt) return reg;
  const at = new Date(pending.resolveAt).toISOString();
  const attempt: PaymentAttempt = {
    id: `att_${randomToken(4)}`,
    method: pending.method,
    status: pending.outcome === "FAILED" ? "failed" : "captured",
    at,
    providerPaymentId: `pay_${randomToken(8)}`,
    error: pending.outcome === "FAILED" ? "BAD_REQUEST_ERROR: Payment declined by issuing bank" : undefined,
  };
  const next: Registration = structuredClone(reg);
  delete next.order.pendingOutcome;
  next.order.attempts.push(attempt);
  if (pending.outcome === "PAID") {
    next.order.status = "PAID";
    next.order.paidAt = at;
    next.status = "CONFIRMED";
    next.pass = { token: randomToken(24) };
    next.messages.push(
      { id: randomToken(4), channel: "email", template: "PAYMENT_CONFIRMED", to: reg.person.email, status: "DELIVERED", at },
      { id: randomToken(4), channel: "sms", template: "PAYMENT_CONFIRMED", to: reg.person.mobile, status: "DELIVERED", at },
    );
    next.audit.push({ at, actor: "webhook:razorpay", action: "order.paid (signature verified)" });
  } else if (pending.outcome === "FAILED") {
    next.order.status = "FAILED";
    next.messages.push({ id: randomToken(4), channel: "email", template: "PAYMENT_FAILED", to: reg.person.email, status: "DELIVERED", at });
    next.audit.push({ at, actor: "webhook:razorpay", action: "payment.failed" });
  } else {
    next.order.status = "MISMATCH";
    next.audit.push({ at, actor: "webhook:razorpay", action: "order.mismatch (amount differs); finance alerted" });
  }
  save(next);
  return next;
}

/* ---------- public API ---------- */

export type MemberCheck = { status: MemberValidation; organisation?: string; message: string };

export async function verifyMember(identifier: string): Promise<MemberCheck> {
  await wait(700);
  const id = identifier.trim().toLowerCase();
  const org = MEMBER_ORGS.find(
    (m) => m.memberNumber.toLowerCase() === id || m.domains.some((d) => id.endsWith(`@${d}`)),
  );
  if (!org) {
    return {
      status: "PENDING_REVIEW",
      message: "We couldn't match this automatically. You can continue at the member rate and the AMAI secretariat will verify it.",
    };
  }
  if (org.status === "lapsed") {
    return {
      status: "REJECTED",
      organisation: org.name,
      message: `${org.name}'s membership has lapsed. Please register as a non-member or contact the secretariat.`,
    };
  }
  return { status: "VERIFIED", organisation: org.name, message: `Verified: ${org.name} is an active AMAI member.` };
}

export type NewRegistration = {
  eventSlug: string;
  categoryId: string;
  audience: Audience;
  memberValidation: MemberValidation;
  memberIdentifier?: string;
  person: Registration["person"];
  billing: Registration["billing"];
  consentMarketing: boolean;
  utmSource?: string;
};

export class ApiError extends Error {
  constructor(public code: "DUPLICATE" | "SOLD_OUT" | "NOT_FOUND", message: string) {
    super(message);
  }
}

export async function createRegistration(input: NewRegistration): Promise<{ publicId: string; orderRef: string }> {
  await wait(900);
  const event = getEvent(input.eventSlug);
  const category = event?.categories.find((c) => c.id === input.categoryId);
  if (!event || !category) throw new ApiError("NOT_FOUND", "This ticket is no longer available.");
  const regs = all().filter((r) => r.eventSlug === event.slug);
  if (regs.some((r) => r.person.email === input.person.email && ["CONFIRMED", "PENDING_PAYMENT"].includes(r.status))) {
    throw new ApiError("DUPLICATE", "This email already has a registration for this event. Check your inbox or contact the secretariat.");
  }
  if (category.capacity !== null && category.seatsTaken + regs.filter((r) => r.categoryId === category.id && r.order.status === "PENDING").length >= category.capacity) {
    throw new ApiError("SOLD_OUT", "Sorry, this category just sold out.");
  }
  const q = quote(category);
  const seq = category.seatsTaken + regs.length + 1;
  const publicId = `AMAI-${event.registrationPrefix}-${String(seq).padStart(6, "0")}`;
  const createdAt = now();
  const reg: Registration = {
    publicId,
    eventSlug: event.slug,
    categoryId: category.id,
    claimedAudience: input.audience,
    memberValidation: input.memberValidation,
    memberIdentifier: input.memberIdentifier,
    status: "PENDING_PAYMENT",
    createdAt,
    person: input.person,
    billing: input.billing,
    consentMarketing: input.consentMarketing,
    utmSource: input.utmSource,
    order: { reference: randomRef(), amountPaise: q.totalPaise, quote: q, status: "PENDING", attempts: [] },
    messages: [{ id: randomToken(4), channel: "email", template: "REGISTRATION_PENDING", to: input.person.email, status: "ACCEPTED", at: createdAt }],
    audit: [{ at: createdAt, actor: "visitor", action: "registration.started" }],
  };
  save(reg);
  return { publicId, orderRef: reg.order.reference };
}

export async function getByOrderRef(ref: string): Promise<Registration | null> {
  await wait(200);
  return all().find((r) => r.order.reference === ref) ?? null;
}

export async function getByToken(token: string): Promise<Registration | null> {
  await wait(200);
  return all().find((r) => r.pass?.token === token) ?? null;
}

export type GatewayOutcome = "PAID" | "FAILED" | "CANCELLED" | "MISMATCH";

/** What the hosted checkout would do: the webhook lands a few seconds after the browser returns. */
export async function simulateGateway(ref: string, outcome: GatewayOutcome, method: PaymentAttempt["method"]) {
  await wait(1200);
  const reg = all().find((r) => r.order.reference === ref);
  if (!reg) throw new ApiError("NOT_FOUND", "Order not found");
  const next = structuredClone(reg);
  if (outcome === "CANCELLED") {
    next.order.status = "CANCELLED";
    next.order.attempts.push({ id: `att_${randomToken(4)}`, method, status: "cancelled", at: now(), providerPaymentId: "—" });
    next.audit.push({ at: now(), actor: "visitor", action: "checkout.dismissed" });
  } else {
    next.order.status = "PENDING";
    next.order.pendingOutcome = { outcome, method, resolveAt: Date.now() + WEBHOOK_DELAY_MS };
  }
  save(next);
}

/** Status the Processing page polls. PENDING with an in-flight payment is reported as PROCESSING. */
export async function getOrderStatus(ref: string): Promise<{ status: OrderStatus; registration: Registration } | null> {
  await wait(250);
  const reg = all().find((r) => r.order.reference === ref);
  if (!reg) return null;
  return { status: reg.order.pendingOutcome ? "PROCESSING" : reg.order.status, registration: reg };
}

export async function retryPayment(ref: string) {
  await wait(300);
  const reg = all().find((r) => r.order.reference === ref);
  if (!reg || !["FAILED", "CANCELLED"].includes(reg.order.status)) return;
  const next = structuredClone(reg);
  next.order.status = "PENDING";
  next.audit.push({ at: now(), actor: "visitor", action: "payment.retry" });
  save(next);
}

/* ---------- staff API ---------- */

export type CheckInResult =
  | { result: "OK"; registration: Registration }
  | { result: "ALREADY_CHECKED_IN"; registration: Registration }
  | { result: "NOT_PAID"; registration: Registration }
  | { result: "INVALID" };

export async function checkIn(tokenOrUrl: string, operator: string): Promise<CheckInResult> {
  await wait(350);
  const token = tokenOrUrl.trim().split("/c/").pop()!.split(/[?#]/)[0];
  const reg = all().find((r) => r.pass?.token === token || r.publicId.toLowerCase() === token.toLowerCase());
  if (!reg) return { result: "INVALID" };
  if (reg.status !== "CONFIRMED" || !reg.pass) return { result: "NOT_PAID", registration: reg };
  if (reg.pass.checkedInAt) return { result: "ALREADY_CHECKED_IN", registration: reg };
  const next = structuredClone(reg);
  next.pass!.checkedInAt = now();
  next.pass!.checkedInBy = operator;
  next.audit.push({ at: now(), actor: operator, action: "checkin.recorded" });
  save(next);
  return { result: "OK", registration: next };
}

export async function resendConfirmation(publicId: string, actor: string) {
  await wait(500);
  const reg = all().find((r) => r.publicId === publicId);
  if (!reg) return;
  const next = structuredClone(reg);
  const template = reg.status === "CONFIRMED" ? "PAYMENT_CONFIRMED" : "REGISTRATION_PENDING";
  next.messages.push({ id: randomToken(4), channel: "email", template, to: reg.person.email, status: "ACCEPTED", at: now() });
  next.audit.push({ at: now(), actor, action: `message.resend ${template}` });
  save(next);
}

export async function reviewMember(publicId: string, decision: "VERIFIED" | "REJECTED", actor: string) {
  await wait(400);
  const reg = all().find((r) => r.publicId === publicId);
  if (!reg) return;
  const next = structuredClone(reg);
  next.memberValidation = decision;
  next.audit.push({ at: now(), actor, action: `member_review.${decision.toLowerCase()}` });
  save(next);
}

export async function refreshOrderStatus(publicId: string, actor: string) {
  await wait(800);
  const reg = all().find((r) => r.publicId === publicId);
  if (!reg) return;
  const next = structuredClone(reg);
  next.audit.push({ at: now(), actor, action: `gateway.status_enquiry → ${reg.order.status}` });
  save(next);
}

export async function submitEnquiry(input: { name: string; email: string; topic: string; message: string }) {
  await wait(800);
  return { reference: `ENQ-${input.topic.slice(0, 3).toUpperCase()}-${randomToken(4).toUpperCase()}` };
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
}

/* ---------- hooks ---------- */

let version = 0;
let snapshot: { version: number; data: Registration[] } | null = null;

if (typeof window !== "undefined") {
  const bump = () => version++;
  window.addEventListener(CHANGE, bump);
  window.addEventListener("storage", bump);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  if (!snapshot || snapshot.version !== version) snapshot = { version, data: all() };
  return snapshot.data;
}

/** Live list of registrations (seed + this browser's changes). null during SSR. */
export function useRegistrations(): Registration[] | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
