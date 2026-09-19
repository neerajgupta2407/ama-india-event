import type { Metadata } from "next";

import { CheckIn } from "@/components/dashboard/check-in";

export const metadata: Metadata = { title: "Check-in" };

export default function CheckInPage() {
  return <CheckIn />;
}
