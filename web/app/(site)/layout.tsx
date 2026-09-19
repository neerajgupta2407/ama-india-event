import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded bg-white px-4 py-2 text-brand-blue-600 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="bg-accent-amber-50 px-4 py-1.5 text-center text-xs text-ink-700">
        Prototype with <strong>dummy data</strong>. No real payments, emails or SMS are sent.
      </div>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
