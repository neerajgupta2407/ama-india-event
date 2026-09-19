import type { Quote, TicketCategory } from "./types";

// Server-side in the real system (IMPLEMENTATION.md §5). Kept pure so the Django port is 1:1.
export function quote(category: TicketCategory, at: Date = new Date()): Quote {
  const earlyBird =
    category.earlyBirdAmountPaise !== undefined &&
    category.earlyBirdUntil !== undefined &&
    at <= new Date(category.earlyBirdUntil);
  const taxablePaise = earlyBird ? category.earlyBirdAmountPaise! : category.baseAmountPaise;
  const gstPaise = Math.round((taxablePaise * category.gstRate) / 100);
  return { taxablePaise, gstPaise, totalPaise: taxablePaise + gstPaise, gstRate: category.gstRate, earlyBird };
}

export const seatsLeft = (c: TicketCategory) => (c.capacity === null ? null : Math.max(0, c.capacity - c.seatsTaken));
