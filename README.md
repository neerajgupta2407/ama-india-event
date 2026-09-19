# AMAI — Event Registration & Payment

Frontend prototype for the redesigned **Alkali Manufacturers Association of India** website and its reusable event microsite, covering registration, payments, notifications, QR passes and a staff dashboard.

It implements the requirements in `AMAI_Registration_and_Payment_Technical_Solution.docx` (K2I Solution, v1.0).

> **Prototype on dummy data.** No backend, no real payments, no emails or SMS. Registrations created in the browser are stored in `localStorage`.

**Live demo:** https://amai-prototype.vercel.app (`noindex`, not for public circulation)

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind v4 |
| Forms | react-hook-form + zod |
| Backend (planned) | Django 5 + DRF, PostgreSQL, Celery/Redis, Wagtail CMS |
| Payments (planned) | Indian gateway via an adapter (Razorpay first) |

## Run it

```bash
cd web
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm lint
```

## Routes

| Route | What it shows |
|---|---|
| `/` | Home: hero, upcoming events, news, SHE/CERN card, publications, members |
| `/events`, `/events/[slug]` | Event list and reusable microsite (agenda, speakers, fees, JSON-LD) |
| `/events/[slug]/register` | 4-step wizard: category → member check → details (GST) → review |
| `/gateway/[ref]` | **Mock** hosted checkout: pick success, decline, amount mismatch or cancel |
| `/pay/[ref]` | Status page: *Processing* until the simulated webhook lands, then Paid / Failed / Mismatch |
| `/c/[token]` | Attendee QR pass |
| `/q/[code]` | Campaign QR redirect with UTM tags, e.g. `/q/ac26-poster` |
| `/contact` | Enquiry form |
| `/dashboard/*` | Staff: overview, registrations + record drawer + CSV export, check-in, reconciliation |
| anything else | Placeholder for content pages that will come from the CMS |

## Demo script

1. Open `/events/annual-conference-2026/register?utm_source=poster`, choose **Member delegate**, verify with `AMAI-M-0011`. Also try `you@dcmshriram.com` (matched by work email), `AMAI-M-0015` (lapsed) or anything else (manual review).
2. Fill in the details, review, **Pay**, then choose **Payment succeeds** and watch Processing become Confirmed.
3. `/dashboard/registrations` — the new row is on top; open it for payment attempts, messages and the audit trail.
4. `/dashboard/check-in` — type the registration ID. A second scan shows **Already checked in**.
5. **Reset demo data** at the bottom of the dashboard sidebar clears your changes.

## Structure

```
web/app/           routes (site, events, registration, gateway, pay, dashboard)
web/components/    UI primitives, site chrome, register wizard, pay, dashboard
web/lib/mock/      the only data boundary: api.ts, data.ts, seed.ts
web/lib/           types.ts, pricing.ts, format.ts (₹ / IST)
```

`lib/mock/api.ts` returns the shapes the future Django endpoints will return, so swapping the mock for the real API means replacing those function bodies with `fetch` calls, leaving the pages unchanged.

## Notes

- Events, prices, member numbers and statistics are **placeholders**. News headlines and the important-links list were copied from ama-india.org (18 Sep 2026).
- The logo is a stand-in; AMAI's official SVG should replace it.
- Design and implementation docs (`DESIGN_SYSTEM.md`, `IMPLEMENTATION.md`) are kept outside version control.
