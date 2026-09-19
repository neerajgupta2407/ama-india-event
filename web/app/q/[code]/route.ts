import { NextResponse, type NextRequest } from "next/server";

import { CAMPAIGN_LINKS } from "@/lib/mock/data";

// Campaign QR: /q/{code} → event page with UTM (docx §6). The real handler also logs the scan via the API.
export async function GET(request: NextRequest, { params }: RouteContext<"/q/[code]">) {
  const { code } = await params;
  const link = CAMPAIGN_LINKS[code];
  const url = new URL(link ? `/events/${link.event}` : "/events", request.url);
  if (link) {
    url.searchParams.set("utm_source", link.source);
    url.searchParams.set("utm_medium", "qr");
    url.searchParams.set("utm_campaign", link.campaign);
  }
  return NextResponse.redirect(url, 302);
}
