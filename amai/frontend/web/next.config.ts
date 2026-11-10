import type { NextConfig } from "next";

// Static export served by nginx (same as the other sites on the staging server).
// There is no Node server at runtime, so the API is reached on the same origin:
// nginx forwards /api/* to Django. Locally, NEXT_PUBLIC_API_URL points at the dev API.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
