import type { Metadata, Viewport } from "next";

import "@/styles/bootstrap.min.css";
import "@/styles/bootstrap-icons.min.css";
import "@/styles/style.css";
import "@/styles/menu_css.css";
import "@/styles/main_css.css";
import "@/styles/responsive_style.css";

import PageEffects from "@/components/layout/PageEffects";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

export const metadata: Metadata = {
  title: {
    default: "12th AMAI Alkali Industry Conference 2027 | 28–29 January 2027",
    template: "%s | 12th AMAI Alkali Industry Conference 2027",
  },
  description:
    "12th AMAI Alkali Industry Conference – Shaping a Competitive, Sustainable and Resilient Future. 28–29 January 2027, Andaz by Hyatt, Aerocity, New Delhi.",
  icons: { icon: "/img/f_icon.jpg" },
  // Stay out of search results until launch.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
        />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <WhatsAppButton />
        <PageEffects />
      </body>
    </html>
  );
}
