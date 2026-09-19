// Deterministic seed registrations for the staff dashboard.
import { quote } from "../pricing";
import type { Audience, MemberValidation, OrderStatus, Registration, RegistrationStatus } from "../types";
import { EVENTS, MEMBER_ORGS } from "./data";

function prng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const FIRST = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Meera", "Arjun", "Kavya", "Sanjay", "Neha", "Rahul", "Divya", "Karan", "Ishita", "Manish", "Pooja", "Suresh", "Lakshmi", "Amit", "Sneha", "Nikhil", "Farah", "Harpreet", "Joseph"];
const LAST = ["Sharma", "Iyer", "Patel", "Nair", "Reddy", "Mehta", "Gupta", "Menon", "Joshi", "Rao", "Kulkarni", "Singh", "Desai", "Banerjee", "Shah", "Pillai", "Khan", "Fernandes"];
const DESIGNATIONS = ["Plant Head", "Process Engineer", "Safety Officer", "GM – Operations", "Commercial Manager", "Director", "Shift In-charge", "Consultant"];
const NON_MEMBER_ORGS = ["Deccan Process Consultants", "Western Logistics Pvt Ltd", "Indo Valves & Fittings", "Coastal Water Treatment Co", "Sunrise Engineering Services", "IIT Bombay"];
const STATES = ["Maharashtra", "Gujarat", "Tamil Nadu", "Rajasthan", "Delhi", "Karnataka", "Odisha"];
const CITIES: Record<string, string> = { Maharashtra: "Mumbai", Gujarat: "Vadodara", "Tamil Nadu": "Chennai", Rajasthan: "Kota", Delhi: "New Delhi", Karnataka: "Bengaluru", Odisha: "Bhubaneswar" };

const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];

export function buildSeed(): Registration[] {
  const r = prng(20260918);
  const out: Registration[] = [];
  const openEvents = EVENTS.filter((e) => e.status === "open");
  const counters: Record<string, number> = {};

  for (let i = 0; i < 64; i++) {
    const event = openEvents[i % 5 === 0 ? 1 : i % 7 === 0 ? 2 : 0];
    const category = pick(r, event.categories);
    const audience: Audience = category.audience;
    const first = pick(r, FIRST);
    const last = pick(r, LAST);
    const member = audience === "MEMBER" ? pick(r, MEMBER_ORGS.filter((m) => m.status === "active")) : undefined;
    const organisation = member ? member.name : audience === "STUDENT" ? "IIT Bombay" : pick(r, NON_MEMBER_ORGS);
    const domain = member ? member.domains[0] : "example.in";
    const state = pick(r, STATES);
    counters[event.slug] = (counters[event.slug] ?? 0) + 1;
    const publicId = `AMAI-${event.registrationPrefix}-${String(counters[event.slug]).padStart(6, "0")}`;
    const created = new Date(Date.UTC(2026, 7, 1) + Math.floor(r() * 47 * 86400000) + Math.floor(r() * 36000000));
    const q = quote(category, created);

    const roll = r();
    let orderStatus: OrderStatus = "PAID";
    let status: RegistrationStatus = "CONFIRMED";
    if (roll > 0.94) [orderStatus, status] = ["FAILED", "PENDING_PAYMENT"];
    else if (roll > 0.89) [orderStatus, status] = ["PENDING", "PENDING_PAYMENT"];
    else if (roll > 0.87) [orderStatus, status] = ["CANCELLED", "PENDING_PAYMENT"];
    if (i === 17) [orderStatus, status] = ["MISMATCH", "PENDING_PAYMENT"];
    if (i === 29) [orderStatus, status] = ["REFUNDED", "REFUNDED"];

    let memberValidation: MemberValidation = audience === "MEMBER" ? "VERIFIED" : "NOT_REQUIRED";
    if (audience === "MEMBER" && (i === 8 || i === 33 || i === 51)) memberValidation = "PENDING_REVIEW";

    const paid = orderStatus === "PAID" || orderStatus === "REFUNDED";
    const paidAt = new Date(created.getTime() + 4 * 60000).toISOString();
    const method = pick(r, ["upi", "upi", "card", "netbanking"] as const);
    const email = `${first}.${last}@${domain}`.toLowerCase();
    const mobile = `+91 9${Math.floor(100000000 + r() * 899999999)}`;

    out.push({
      publicId,
      eventSlug: event.slug,
      categoryId: category.id,
      claimedAudience: audience,
      memberValidation,
      memberIdentifier: member ? (r() > 0.5 ? member.memberNumber : email) : undefined,
      status,
      createdAt: created.toISOString(),
      person: { fullName: `${first} ${last}`, email, mobile, organisation, designation: pick(r, DESIGNATIONS), city: CITIES[state], state },
      billing: { billingName: organisation, state, gstin: member && r() > 0.3 ? `27AAACT${1000 + i}F1Z${i % 10}` : undefined },
      consentMarketing: r() > 0.5,
      utmSource: pick(r, ["email", "direct", "poster", "linkedin", "alkali-bulletin", "direct"]),
      order: {
        reference: `ORD-${Math.floor(r() * 36 ** 8).toString(36).toUpperCase().padStart(8, "X")}`,
        amountPaise: q.totalPaise,
        quote: q,
        status: orderStatus,
        paidAt: paid ? paidAt : undefined,
        attempts:
          orderStatus === "PENDING"
            ? []
            : [
                {
                  id: `att_${i}`,
                  method,
                  status: paid ? "captured" : orderStatus === "CANCELLED" ? "cancelled" : "failed",
                  at: paidAt,
                  providerPaymentId: `pay_${(i * 7919).toString(36)}Qx${i}`,
                  error: orderStatus === "FAILED" ? "BAD_REQUEST_ERROR: Payment declined by bank" : undefined,
                },
              ],
      },
      pass: paid && status === "CONFIRMED" ? { token: `seed-${publicId.toLowerCase()}` } : undefined,
      messages: paid
        ? [
            { id: `m${i}a`, channel: "email", template: "PAYMENT_CONFIRMED", to: email, status: i % 23 === 0 ? "BOUNCED" : "DELIVERED", at: paidAt },
            { id: `m${i}b`, channel: "sms", template: "PAYMENT_CONFIRMED", to: mobile, status: "DELIVERED", at: paidAt },
          ]
        : [{ id: `m${i}a`, channel: "email", template: "REGISTRATION_PENDING", to: email, status: "DELIVERED", at: created.toISOString() }],
      audit: [
        { at: created.toISOString(), actor: "visitor", action: "registration.started" },
        ...(paid ? [{ at: paidAt, actor: "webhook:razorpay", action: "order.paid" }] : []),
        ...(orderStatus === "MISMATCH" ? [{ at: paidAt, actor: "webhook:razorpay", action: "order.mismatch (amount 1180000 ≠ 1416000)" }] : []),
        ...(orderStatus === "REFUNDED" ? [{ at: "2026-09-10T06:12:00Z", actor: "finance@ama-india.org", action: "order.refunded" }] : []),
      ],
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
