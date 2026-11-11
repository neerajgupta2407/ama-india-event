import type { MetadataRoute } from "next";

import { SITE } from "@/config/urls";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (!SITE.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/pay/", "/c/"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
