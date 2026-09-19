const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const inrShort = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatINR = (paise: number) => inr.format(paise / 100);
export const formatINRShort = (paise: number) => inrShort.format(paise / 100);

const IST = "Asia/Kolkata";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST,
  });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: IST });

export function formatDateRange(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const opts = { timeZone: IST } as const;
  const sameMonth =
    s.toLocaleDateString("en-IN", { month: "short", year: "numeric", ...opts }) ===
    e.toLocaleDateString("en-IN", { month: "short", year: "numeric", ...opts });
  if (sameMonth) {
    const d1 = s.toLocaleDateString("en-IN", { day: "numeric", ...opts });
    return d1 === e.toLocaleDateString("en-IN", { day: "numeric", ...opts })
      ? formatDate(startIso)
      : `${d1}–${formatDate(endIso)}`;
  }
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

export const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", timeZone: IST });
export const monthOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "short", timeZone: IST }).toUpperCase();
