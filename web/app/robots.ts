import type { MetadataRoute } from "next";

// Prototype with dummy data: keep it out of search engines until AMAI signs off.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
