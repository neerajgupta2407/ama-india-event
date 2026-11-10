import type { Metadata, Viewport } from "next";

import "@/styles/bootstrap.min.css";
import "@/styles/bootstrap-icons.min.css";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: { default: "AMAI Events desk", template: "%s | AMAI Events desk" },
  description: "Staff dashboard for AMAI event registrations.",
  // Never indexed, and no link to it from the public site.
  robots: { index: false, follow: false },
  icons: { icon: "/img/f_icon.jpg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
