import { ArrowRight, BookOpen, Download, FileText, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { EventCard } from "@/components/event/event-card";
import { HexPattern } from "@/components/site/hex-pattern";
import { ButtonLink, Card, Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";
import { MEMBER_ORGS, NEWS, PUBLICATIONS, SAMPLE_STATS, SHE_ITEMS, upcomingEvents } from "@/lib/mock/data";

const coverTone = {
  blue: "from-brand-blue-600 to-brand-blue-700",
  indigo: "from-brand-indigo-600 to-[#2b2e6e]",
  amber: "from-accent-amber-400 to-[#e59a12]",
};

export default function HomePage() {
  const events = upcomingEvents();
  const featured = events[0];
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-blue-700">
        <HexPattern />
        <div className="absolute inset-0 -z-20 bg-gradient-to-r from-brand-blue-700 via-brand-blue-600 to-brand-indigo-600" />
        <Container className="py-20 sm:py-28">
          <div className="max-w-2xl animate-rise">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase ring-1 ring-white/20">
              <span className="size-1.5 rounded-full bg-accent-amber-400" /> Alkali Manufacturers Association of India
            </p>
            <h1 className="font-serif text-[40px] leading-[1.1] font-bold text-white sm:text-[54px]">
              Representing Indian Alkali Industry Nationally and Globally
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              AMAI supports the industry’s commitment to technological and economic growth, and to continuous improvement in
              protecting human health and the environment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/events/${featured.slug}`} variant="amber" size="lg">
                Register: {featured.shortTitle} <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/about" size="lg" variant="inverse">
                About AMAI
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Latest strip (replaces the marquee ticker) */}
      <div className="border-b border-line-200 bg-surface-100">
        <Container className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
          <span className="inline-flex items-center gap-2 font-semibold text-ink-900">
            <span className="size-2 rounded-full bg-accent-amber-400" aria-hidden /> Latest
          </span>
          <Link href="/publications/bulletin" className="flex-1 truncate text-ink-700 hover:text-brand-blue-600">
            {NEWS[1].title}. Free access and download for members.
          </Link>
          <Link href="/media" className="font-medium text-brand-blue-600 hover:underline">
            View all
          </Link>
        </Container>
      </div>

      {/* Events */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Events"
            title="Upcoming events"
            action={
              <Link href="/events" className="hidden items-center gap-1 text-sm font-medium text-brand-blue-600 hover:underline sm:inline-flex">
                All events <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </Container>
      </section>

      {/* News + SHE */}
      <section className="bg-brand-blue-50 py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <SectionHeading eyebrow="What’s new" title="News & announcements" />
            <ul className="divide-y divide-line-200 rounded-[var(--radius-card)] border border-line-200 bg-white">
              {NEWS.map((n) => (
                <li key={n.title}>
                  <a href={n.href} className="group flex items-start gap-4 p-4 hover:bg-brand-blue-50/50 sm:p-5">
                    <time className="w-24 shrink-0 pt-0.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                      {formatDate(n.date)}
                    </time>
                    <span className="flex-1 font-medium text-ink-900 group-hover:text-brand-blue-600">{n.title}</span>
                    {n.kind === "pdf" && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                        <FileText className="size-4" aria-hidden /> PDF
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="SHE" title="Safety, Health & Environment" />
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 bg-emergency px-5 py-4 text-white">
                <ShieldAlert className="size-7 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase opacity-90">Chlorine emergency, 24×7</p>
                  <a href="tel:1800111735" className="tnum text-2xl font-bold">
                    1800-11-1735
                  </a>
                </div>
              </div>
              <ul className="space-y-4 p-5 text-sm">
                {SHE_ITEMS.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-blue-600" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="px-5 pb-5">
                <ButtonLink href="/she" variant="secondary" size="sm">
                  SHE initiatives <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Industry data" title="The industry at a glance" />
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SAMPLE_STATS.map((s) => (
              <Card key={s.label} className="p-5 sm:p-6">
                <dt className="text-sm text-ink-500">{s.label}</dt>
                <dd className="mt-2 font-serif text-3xl font-bold text-ink-900 sm:text-4xl">{s.value}</dd>
                <p className="mt-2 text-xs text-ink-400">{s.note}</p>
              </Card>
            ))}
          </dl>
        </Container>
      </section>

      {/* Publications */}
      <section className="border-y border-line-200 bg-surface-100 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Publications"
            title="Reports, directory & bulletin"
            action={
              <Link href="/publications" className="hidden items-center gap-1 text-sm font-medium text-brand-blue-600 hover:underline sm:inline-flex">
                All publications <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {PUBLICATIONS.map((p) => (
              <Card key={p.title} className="flex gap-4 p-4">
                <div
                  className={`flex aspect-[3/4] w-20 shrink-0 flex-col justify-between rounded-md bg-gradient-to-br p-2 ${coverTone[p.cover]} ${p.cover === "amber" ? "text-ink-900" : "text-white"}`}
                >
                  <BookOpen className="size-4" aria-hidden />
                  <span className="text-[10px] leading-tight font-semibold">{p.title}</span>
                </div>
                <div className="flex flex-col">
                  <Eyebrow>{p.kind}</Eyebrow>
                  <h3 className="mt-1 font-semibold text-ink-900">{p.title}</h3>
                  <p className="text-sm text-ink-500">{p.issue}</p>
                  <a href="#" className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-blue-600 hover:underline">
                    <Download className="size-4" aria-hidden /> Download
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Members */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Members" title="Our member companies" />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MEMBER_ORGS.map((m) => (
              <li
                key={m.name}
                className="flex h-20 items-center justify-center rounded-[var(--radius-card)] border border-line-200 px-4 text-center text-sm font-semibold text-ink-500 grayscale transition hover:border-brand-blue-100 hover:text-brand-blue-600 hover:grayscale-0"
              >
                {m.name}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-400">Logo tiles are placeholders until member logos are supplied.</p>
        </Container>
      </section>
    </>
  );
}
