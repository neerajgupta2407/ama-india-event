"use client";

import { useEffect, useState } from "react";

import { Card, Spinner } from "@/components/ui/primitives";
import { getByToken, useRegistrations } from "@/lib/mock/api";
import type { Registration } from "@/lib/types";

import { AttendeePass } from "./attendee-pass";

export function PassView({ token }: { token: string }) {
  const all = useRegistrations(); // re-renders when check-in happens in another tab
  const [reg, setReg] = useState<Registration | null | undefined>();
  useEffect(() => {
    getByToken(token).then(setReg);
  }, [token, all]);

  if (reg === undefined)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8 text-brand-blue-600" />
      </div>
    );
  if (!reg || reg.status !== "CONFIRMED")
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="font-semibold text-ink-900">This pass isn’t valid.</p>
        <p className="mt-2 text-sm text-ink-500">It may have been cancelled or refunded. Contact info@ama-india.org.</p>
      </Card>
    );
  return (
    <>
      <AttendeePass reg={reg} />
      <p className="mt-6 text-center text-sm text-ink-500">Show this QR code at the registration desk.</p>
    </>
  );
}
