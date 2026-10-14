import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartLine,
  Download,
  FileText,
  Megaphone,
  ShieldAlert,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EventCard } from "@/components/event/event-card";
import { CountdownBar } from "@/components/event/microsite/sections";
import {
  ButtonLink,
  Card,
  Container,
  Eyebrow,
  HeroGlow,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";
import { formatDate, formatDateRange } from "@/lib/format";
import {
  FEATURED_EVENT_SLUG,
  MEMBER_ORGS,
  NEWS,
  PUBLICATIONS,
  SAMPLE_STATS,
  SECRETARIAT,
  SHE_ITEMS,
  getEvent,
  upcomingEvents,
} from "@/lib/mock/data";

const coverTone = {
  blue: "from-brand-blue-500 to-brand-blue-700",
  indigo: "from-brand-indigo-600 to-[#132848]",
  amber: "from-accent-amber-400 to-[#e59a12]",
};

export default function HomePage() {
  const events = upcomingEvents();
  const featured = getEvent(FEATURED_EVENT_SLUG) ?? events[0];
  const featuredHref = `/events/${featured.slug}`;
  return (
    <>
      {/* Hero (ai_hero) */}
      <section className="relative isolate overflow-hidden bg-hero pt-12 pb-24 sm:pt-16 sm:pb-28">
        <HeroGlow />
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-rise">
            <Eyebrow>Alkali Manufacturers Association of India</Eyebrow>
            <h1 className="mt-5 mb-4 text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.08] font-extrabold">
              Representing the Indian Alkali Industry
              <span className="block text-brand-blue-600">Nationally and Globally</span>
            </h1>
            <p className="max-w-[540px] text-lg text-ink-500">
              AMAI supports the industry’s commitment to technological and economic growth, and to continuous improvement in
              protecting human health and the environment.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={featuredHref} size="lg">
                {featured.shortTitle} <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/about" size="lg" variant="secondary">
                About AMAI
              </ButtonLink>
            </div>
          </div>

          <Link href={featuredHref} className="group relative block" aria-label={`${featured.title}: details and registration`}>
            <div className="relative h-[280px] overflow-hidden rounded-[22px] border-[6px] border-white bg-brand-blue-50 shadow-[var(--shadow-lift)] sm:h-[400px]">
              {featured.microsite && (
                <Image
                  src={featured.microsite.heroImage}
                  alt=""
                  fill
                  preload
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/85 to-transparent p-5 pt-16 text-white sm:p-6 sm:pt-20">
                <p className="text-xs font-bold tracking-[0.14em] uppercase opacity-85">Featured event</p>
                <p className="mt-1 text-xl leading-snug font-extrabold sm:text-2xl">{featured.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm opacity-90">
                  <CalendarDays className="size-4" aria-hidden /> {formatDateRange(featured.startsAt, featured.endsAt)} ·{" "}
                  {featured.city}
                </p>
              </div>
            </div>
          </Link>
        </Container>
      </section>

      <CountdownBar event={featured} registerHref={`${featuredHref}#register`} />

      {/* Latest strip (replaces the marquee ticker) */}
      <Container className="mt-8">
        <div className="flex flex-col gap-1 rounded-[14px] border border-line-200 bg-surface-100 px-5 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
          <span className="inline-flex items-center gap-2 font-bold text-ink-900">
            <Megaphone className="size-4 text-brand-blue-600" aria-hidden /> Latest
          </span>
          <Link href="/publications/bulletin" className="flex-1 truncate text-ink-700 hover:text-brand-blue-600">
            {NEWS[1].title}. Free access and download for members.
          </Link>
          <Link href="/media" className="font-bold text-brand-blue-600 hover:underline">
            View all
          </Link>
        </div>
      </Container>

      {/* Events: target of the header's "Register for events" button */}
      <Section id="upcoming-events">
        <Container>
          <SectionHeading
            eyebrow="Events"
            icon={CalendarDays}
            title="Upcoming events"
            action={
              <ButtonLink href="/events" variant="secondary" className="max-sm:hidden">
                All events <ArrowRight className="size-4" />
              </ButtonLink>
            }
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </Container>
      </Section>

      {/* News + SHE */}
      <Section tone="fade">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <SectionHeading eyebrow="What’s new" icon={Megaphone} title="News & announcements" />
            <ul className="divide-y divide-line-200 overflow-hidden rounded-[var(--radius-card)] border border-line-200 bg-white">
              {NEWS.map((n) => (
                <li key={n.title}>
                  <a href={n.href} className="group flex items-start gap-4 p-4 hover:bg-brand-blue-50/60 sm:p-5">
                    <time className="w-24 shrink-0 pt-0.5 text-xs font-bold tracking-wide text-ink-500 uppercase">
                      {formatDate(n.date)}
                    </time>
                    <span className="flex-1 font-semibold text-ink-900 group-hover:text-brand-blue-600">{n.title}</span>
                    {n.kind === "pdf" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600">
                        <FileText className="size-4" aria-hidden /> PDF
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="SHE" icon={ShieldAlert} title="Safety, Health & Environment" />
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 bg-emergency px-5 py-4 text-white">
                <ShieldAlert className="size-7 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase opacity-90">Chlorine emergency, 24×7</p>
                  <a href={`tel:${SECRETARIAT.cern.tel}`} className="tnum text-2xl font-extrabold">
                    {SECRETARIAT.cern.label}
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
      </Section>

      {/* Stats */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Industry data" icon={ChartLine} title="The industry at a glance" />
          <dl className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {SAMPLE_STATS.map((s) => (
              <Card
                key={s.label}
                className="p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue-500 hover:shadow-[var(--shadow-soft)] sm:p-6"
              >
                <dt className="text-sm font-semibold text-ink-500">{s.label}</dt>
                <dd className="mt-2 text-3xl font-extrabold text-brand-blue-600 sm:text-4xl">{s.value}</dd>
                <p className="mt-2 text-xs text-ink-400">{s.note}</p>
              </Card>
            ))}
          </dl>
        </Container>
      </Section>

      {/* Publications */}
      <Section tone="soft">
        <Container>
          <SectionHeading
            eyebrow="Publications"
            icon={BookOpen}
            title="Reports, directory & bulletin"
            action={
              <ButtonLink href="/publications" variant="secondary" className="max-sm:hidden">
                All publications <ArrowRight className="size-4" />
              </ButtonLink>
            }
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {PUBLICATIONS.map((p) => (
              <Card key={p.title} className="flex gap-4 p-4">
                <div
                  className={`flex aspect-[3/4] w-20 shrink-0 flex-col justify-between rounded-lg bg-gradient-to-br p-2 ${coverTone[p.cover]} ${p.cover === "amber" ? "text-ink-900" : "text-white"}`}
                >
                  <BookOpen className="size-4" aria-hidden />
                  <span className="text-[10px] leading-tight font-bold">{p.title}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-brand-blue-600 uppercase">{p.kind}</span>
                  <h3 className="mt-1 font-extrabold text-ink-900">{p.title}</h3>
                  <p className="text-sm text-ink-500">{p.issue}</p>
                  <a href="#" className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand-blue-600 hover:underline">
                    <Download className="size-4" aria-hidden /> Download
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Members */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Members" icon={Users} title="Our member companies" />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MEMBER_ORGS.map((m) => (
              <li
                key={m.name}
                className="flex h-20 items-center justify-center rounded-[14px] border border-line-200 bg-white px-4 text-center text-sm font-bold text-ink-500 transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-blue-600 hover:shadow-[0_10px_24px_rgb(31_111_235/.12)]"
              >
                {m.name}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-400">Logo tiles are placeholders until member logos are supplied.</p>
        </Container>
      </Section>
    </>
  );
}
