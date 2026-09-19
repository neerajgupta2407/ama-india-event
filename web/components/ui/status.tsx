import clsx from "clsx";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ShieldQuestion,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { MemberValidation, OrderStatus } from "@/lib/types";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<Tone, string> = {
  success: "bg-success-bg text-success ring-success/20",
  warning: "bg-warning-bg text-warning ring-warning/20",
  danger: "bg-danger-bg text-danger ring-danger/20",
  info: "bg-brand-blue-50 text-brand-blue-600 ring-brand-blue-600/20",
  neutral: "bg-surface-100 text-ink-500 ring-ink-400/30",
};

export function Chip({ tone, icon: Icon, children, className }: { tone: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

// DESIGN_SYSTEM.md §2.4
export const ORDER_STATUS: Record<OrderStatus, { tone: Tone; icon: LucideIcon; label: string; visitor: string }> = {
  PENDING: { tone: "warning", icon: Clock, label: "Pending", visitor: "Payment is awaiting confirmation" },
  PROCESSING: { tone: "warning", icon: Loader2, label: "Processing", visitor: "We are confirming your payment" },
  PAID: { tone: "success", icon: CheckCircle2, label: "Paid", visitor: "Registration confirmed" },
  FAILED: { tone: "danger", icon: XCircle, label: "Failed", visitor: "Payment was not completed" },
  CANCELLED: { tone: "neutral", icon: ArrowLeft, label: "Cancelled", visitor: "Payment was cancelled" },
  MISMATCH: { tone: "danger", icon: AlertTriangle, label: "Mismatch", visitor: "Payment requires review" },
  REFUNDED: { tone: "info", icon: RotateCcw, label: "Refunded", visitor: "Refund processed" },
};

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {s.label}
    </Chip>
  );
}

const MEMBER: Record<MemberValidation, { tone: Tone; icon?: LucideIcon; label: string }> = {
  NOT_REQUIRED: { tone: "neutral", label: "n/a" },
  VERIFIED: { tone: "success", icon: BadgeCheck, label: "Verified" },
  PENDING_REVIEW: { tone: "warning", icon: ShieldQuestion, label: "Needs review" },
  REJECTED: { tone: "danger", icon: XCircle, label: "Rejected" },
};

export function MemberChip({ value }: { value: MemberValidation }) {
  const m = MEMBER[value];
  return (
    <Chip tone={m.tone} icon={m.icon}>
      {m.label}
    </Chip>
  );
}
