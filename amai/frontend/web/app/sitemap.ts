import type { MetadataRoute } from "next";

import { SITE } from "@/config/urls";
import { CATEGORIES } from "@/utils/registration";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1 },
    ...Object.keys(CATEGORIES).map((category) => ({
      url: `${SITE.url}/register/${category}/`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
