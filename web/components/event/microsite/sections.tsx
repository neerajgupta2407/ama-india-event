// Server-rendered sections of the conference microsite, ported from ai_site/index.html.
// Each takes the event (and its microsite content) and is skipped by the page when its data is absent.
import {
  ArrowRight,
  Award,
  CalendarDays,
  ChartLine,
  CircleCheck,
  Check,
  ExternalLink,
  Globe,
  Hourglass,
  IdCard,
  Images,
  Leaf,
  Lightbulb,
  Mail,
  MapPin,
  MessagesSquare,
  Mic,
  Network,
  Phone,
  Ticket,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Card, Container, Eyebrow, HeroGlow, IconTile, Section, SectionHeading, buttonClass } from "@/components/ui/primitives";
import { formatDate, formatDateRange, formatINRShort } from "@/lib/format";
import { SECRETARIAT } from "@/lib/mock/data";
import { quote } from "@/lib/pricing";
import type { AmaiEvent, Microsite } from "@/lib/types";

import { Countdown } from "./countdown";
import { Faq } from "./faq";
import { Reveal } from "./reveal";

type Props = { event: AmaiEvent; site: Microsite };

const IST = { timeZone: "Asia/Kolkata" } as const;
const weekday = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", ...IST });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", ...IST });
const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric", ...IST });
const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", ...IST });

const registerHref = (event: AmaiEvent, categoryId?: string) =>
  `/events/${event.slug}/register${categoryId ? `?category=${categoryId}` : ""}`;

export function Hero({ event, site }: Props) {
  const sameDay = day(event.startsAt) === day(event.endsAt);
  const days = sameDay ? day(event.startsAt) : `${day(event.startsAt)}–${day(event.endsAt)}`;
  return (
    <header className="relative isolate overflow-hidden bg-hero pt-12 pb-24 sm:pt-16 sm:pb-28">
      <HeroGlow />
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="animate-rise">
          {site.edition && (
            <span className="inline-flex items-center gap-2.5 rounded-full bg-brand-blue-600 px-4 py-1.5 text-[13px] font-bold tracking-[0.04em] text-white uppercase">
              <Award className="size-4" aria-hidden /> {site.edition}
            </span>
          )}
          <h1 className="mt-5 mb-3.5 text-[clamp(2.2rem,4.8vw,3.6rem)] leading-[1.08] font-extrabold">
            {site.heroTitle[0]}
            <span className="block text-brand-blue-600">{site.heroTitle[1]}</span>
          </h1>
          <p className="max-w-[520px] text-lg text-ink-500">{event.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Chip icon={CalendarDays}>
              {formatDateRange(event.startsAt, event.endsAt)} ({weekday(event.startsAt)}
              {!sameDay && ` & ${weekday(event.endsAt)}`})
            </Chip>
            <Chip icon={MapPin}>
              {event.venue}, {event.city}
            </Chip>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {event.status === "open" && (
              <a href="#register" className={buttonClass("primary", "lg")}>
                Register Now <ArrowRight className="size-4" aria-hidden />
              </a>
            )}
            <a href="#about" className={buttonClass("secondary", "lg")}>
              Explore the Conference
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="relative h-[280px] overflow-hidden rounded-[22px] border-[6px] border-white bg-brand-blue-50 shadow-[var(--shadow-lift)] sm:h-[410px]">
            <Image src={site.heroImage} alt={event.title} fill preload sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          </div>
          <div className="absolute bottom-7 left-3 rounded-2xl border border-line-200 bg-white px-5 py-3.5 text-center shadow-[0_14px_34px_rgb(31_111_235/.2)] lg:-left-6">
            <b className="block text-[2rem] leading-none font-extrabold text-brand-blue-600">{days}</b>
            <span className="text-[11px] font-bold tracking-[0.1em] text-ink-500 uppercase">{monthYear(event.startsAt)}</span>
          </div>
        </div>
      </Container>
    </header>
  );
}

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-xl border border-line-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-[0_6px_16px_rgb(31_111_235/.08)]">
      <Icon className="size-[18px] shrink-0 text-brand-blue-600" aria-hidden />
      {children}
    </span>
  );
}

export function CountdownBar({ event, registerHref = "#register" }: { event: AmaiEvent; registerHref?: string }) {
  return (
    <Container className="relative z-10 -mt-14">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-[20px] border border-line-200 bg-white px-6 py-5 shadow-[0_18px_44px_rgb(31_111_235/.14)] sm:px-7">
        <div>
          <Eyebrow icon={Hourglass} className="mb-3">
            Countdown
          </Eyebrow>
          <p className="font-bold text-ink-900">
            {event.shortTitle} begins {longDate(event.startsAt)}
          </p>
        </div>
        <Countdown startsAt={event.startsAt} />
        {event.status === "open" && (
          <Link href={registerHref} className={buttonClass("primary")}>
            Register Now
          </Link>
        )}
      </div>
    </Container>
  );
}

export function About({ site }: Props) {
  const a = site.about;
  return (
    <Section id="about" className="scroll-mt-12">
      <Container>
        <Reveal className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
          <div className="relative min-h-[340px] overflow-hidden rounded-[22px] border-[6px] border-white bg-brand-blue-50 shadow-[0_20px_44px_rgb(31_111_235/.16)]">
            <Image src={a.image} alt="About the conference" fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
          </div>
          <div>
            <Eyebrow icon={Lightbulb}>About the Conference</Eyebrow>
            <h2 className="mt-3.5 mb-2.5 text-[clamp(1.6rem,3vw,2.15rem)] font-extrabold">{a.title}</h2>
            <p className="text-[15.5px] text-ink-500">{a.body}</p>
            <h3 className="mt-6 mb-1 text-base font-bold">{a.focusTitle}</h3>
            <ul>
              {a.focus.map((f) => (
                <li key={f} className="flex items-start gap-3 border-b border-dashed border-line-200 py-2.5 text-[14.5px] last:border-0">
                  <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-brand-blue-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            {a.note && <p className="mt-2 text-sm text-ink-500">{a.note}</p>}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

const WHY_ICONS = [ChartLine, Lightbulb, Network, Leaf];

export function WhyAttend({ site }: Props) {
  const w = site.whyAttend;
  return (
    <Section tone="fade">
      <Container>
        <Reveal>
          <SectionHeading center eyebrow="Why attend" icon={CircleCheck} title={w.title} sub={w.sub} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {w.items.map((it, i) => (
              <HoverCard key={it.title} className="p-6">
                <IconTile icon={WHY_ICONS[i % WHY_ICONS.length]} className="mb-4" />
                <h3 className="mb-1.5 text-[17px] font-extrabold">{it.title}</h3>
                <p className="text-sm text-ink-500">{it.text}</p>
              </HoverCard>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function HoverCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`h-full overflow-hidden rounded-[var(--radius-card)] border border-line-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-blue-500 hover:shadow-[var(--shadow-soft)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function Themes({ site }: Props) {
  const t = site.themes;
  return (
    <Section>
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Conference themes"
            icon={Lightbulb}
            title={t.title}
            action={t.note && <span className="rounded-full bg-brand-blue-50 px-3 py-1 text-xs font-bold text-brand-blue-600">{t.note}</span>}
          />
          <div className="grid gap-5 md:grid-cols-3">
            {t.items.map((it) => (
              <HoverCard key={it.title} className="flex flex-col">
                <div className="relative aspect-[4/3] bg-brand-blue-50">
                  <Image src={it.image} alt={it.title} fill sizes="(min-width: 768px) 380px, 100vw" className="object-cover" />
                </div>
                <div className="px-5 pt-5 pb-6">
                  <b className="text-[17px] font-extrabold text-ink-900">{it.title}</b>
                  <p className="mt-1.5 text-sm text-ink-500">{it.text}</p>
                </div>
              </HoverCard>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Agenda({ event, site }: Props) {
  return (
    <Section id="agenda" tone="soft" className="scroll-mt-12">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Agenda"
            icon={CalendarDays}
            title={site.days.length === 2 ? "Two-day programme" : "Programme"}
            action={
              event.status === "open" && (
                <a href="#register" className={buttonClass("secondary")}>
                  Register now
                </a>
              )
            }
          />
          <div className="grid gap-5 md:grid-cols-2">
            {site.days.map((d) => (
              <div
                key={d.date}
                className="flex h-full gap-5 rounded-[20px] border border-line-200 bg-[linear-gradient(135deg,#fff_40%,var(--color-brand-blue-50))] p-6 sm:p-7"
              >
                <div className="flex size-[74px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-brand-blue-600 leading-none text-white">
                  <b className="text-[1.7rem] font-extrabold">{day(d.date)}</b>
                  <span className="mt-1 text-[10px] font-bold tracking-[0.14em] uppercase">
                    {new Date(d.date).toLocaleDateString("en-IN", { month: "long", ...IST })}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">{d.label}</h3>
                  <p className="mt-1 text-sm text-ink-500">{d.summary}</p>
                  <div className="flex flex-wrap">
                    {d.tags.map((t) => (
                      <span
                        key={t}
                        className="mt-2.5 mr-1.5 rounded-full border border-line-200 bg-white px-2.5 py-0.5 text-xs font-bold text-brand-blue-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Speakers({ event, site }: Props) {
  const placeholders = event.speakers.length === 0;
  const cards = placeholders
    ? Array.from({ length: 4 }, () => ({ name: "To be announced", role: "Designation", org: "Organisation", photo: undefined }))
    : event.speakers;
  return (
    <Section id="speakers" className="scroll-mt-12">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Speakers"
            icon={Mic}
            title="Voices of the industry"
            action={
              site.speakersNote && (
                <span className="rounded-full bg-brand-blue-50 px-3 py-1 text-xs font-bold text-brand-blue-600">{site.speakersNote}</span>
              )
            }
          />
          <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {cards.map((s, i) => (
              <li key={i}>
                <article className="h-full overflow-hidden rounded-[var(--radius-card)] border border-line-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgb(31_111_235/.14)]">
                  <div className="relative grid aspect-square place-items-center border-b border-dashed border-[#b4cbee] bg-brand-blue-50 text-[#b4cbee]">
                    {s.photo ? (
                      <Image src={s.photo} alt={s.name} fill sizes="300px" className="object-cover" />
                    ) : (
                      <UserRound className="size-16" aria-hidden />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 text-[15px] font-extrabold">{s.name}</h3>
                    <p className="mb-1 text-[13px] text-ink-500">{s.role}</p>
                    <p className="text-[13px] font-bold tracking-[0.04em] text-brand-blue-600 uppercase">{s.org}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Participate({ site }: Props) {
  return (
    <Section id="participate" tone="soft" className="scroll-mt-12">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="Participate" icon={MessagesSquare} title="Exhibit or partner with AMAI" />
          <div className="grid gap-6 md:grid-cols-2">
            {site.participate.map((p) => (
              <div
                key={p.title}
                className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-blue-50 sm:aspect-[16/9]">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(min-width: 768px) 580px, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col items-start gap-1.5 px-7 pt-6 pb-7">
                  <h3 className="text-xl font-extrabold">{p.title}</h3>
                  <p className="mb-3.5 text-[15px] text-ink-500">{p.text}</p>
                  <Link href={p.href} className={buttonClass("primary", "md", "mt-auto")}>
                    {p.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Organisations({ site }: Props) {
  const o = site.organisations;
  return (
    <Section id="organisations" className="scroll-mt-12">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Participating organisations"
            icon={Network}
            title={o.title}
            sub={o.sub}
            action={
              <Link href="/events#past" className={buttonClass("secondary")}>
                View past editions
              </Link>
            }
          />
          <ul className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
            {o.logos.map((l) => (
              <li
                key={l.name}
                className="grid place-items-center rounded-[14px] border border-line-200 bg-white p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(31_111_235/.12)]"
              >
                <Image src={l.image} alt={l.name} width={200} height={200} sizes="160px" className="h-auto w-full object-contain" />
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}

const FEE_ICONS: Record<string, LucideIcon> = { MEMBER: IdCard, NON_MEMBER: UserRound, STUDENT: UserRound };

export function Registration({ event, site }: Props) {
  const open = event.status === "open";
  return (
    <Section id="register" tone="fade" className="scroll-mt-12">
      <Container>
        <Reveal>
          <SectionHeading
            center
            eyebrow="Registration"
            icon={Ticket}
            title={`Register for the ${event.title.replace(/ \d{4}$/, "")}`}
            sub={`${formatDateRange(event.startsAt, event.endsAt)} · ${event.venue}, ${event.city}`}
          />
          <div className="grid gap-5 md:grid-cols-3">
            {event.categories.map((c) => {
              const q = quote(c);
              const Icon = FEE_ICONS[c.audience] ?? UserRound;
              return (
                <FeeCard
                  key={c.id}
                  icon={Icon}
                  name={c.name}
                  amount={formatINRShort(q.taxablePaise)}
                  struck={q.earlyBird ? formatINRShort(c.baseAmountPaise) : undefined}
                  note={`+ GST as applicable (current rate ${c.gstRate}%) per participant`}
                  points={site.feePoints}
                  cta={open ? { label: `Register as ${c.name.toLowerCase()}`, href: registerHref(event, c.id) } : undefined}
                />
              );
            })}
            {site.offlineFees.map((f) => (
              <FeeCard
                key={f.name}
                icon={Globe}
                name={f.name}
                amount={f.amount}
                note={f.note}
                points={f.points}
                cta={open ? { label: "Contact the secretariat", href: f.href, secondary: true } : undefined}
              />
            ))}
          </div>
          {open && (
            <Card className="mx-auto mt-10 flex max-w-[760px] flex-col items-center gap-4 p-7 text-center shadow-[0_18px_44px_rgb(31_111_235/.10)] sm:p-9">
              <h3 className="text-[22px] font-extrabold">Register online in four steps</h3>
              <p className="text-ink-500">
                Choose your category, verify membership, add GST details and pay by UPI, card or net banking. You get an instant
                confirmation, a GST invoice and a QR pass for check-in.
              </p>
              <Link href={registerHref(event)} className={buttonClass("primary", "lg")}>
                Start registration <ArrowRight className="size-4" aria-hidden />
              </Link>
              <p className="text-xs text-ink-500">Online registration closes {formatDate(event.registrationClosesAt)}</p>
            </Card>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}

function FeeCard({
  icon: Icon,
  name,
  amount,
  struck,
  note,
  points,
  cta,
}: {
  icon: LucideIcon;
  name: string;
  amount: string;
  struck?: string;
  note: string;
  points: string[];
  cta?: { label: string; href: string; secondary?: boolean };
}) {
  return (
    <div className="flex h-full flex-col rounded-[var(--radius-card)] border-2 border-brand-blue-600 bg-white p-7 shadow-[0_16px_38px_rgb(31_111_235/.15)]">
      <h3 className="flex items-center gap-2.5 text-base font-extrabold">
        <Icon className="size-5 shrink-0 text-brand-blue-600" aria-hidden />
        {name}
      </h3>
      <p className="mt-3 mb-0.5 text-[1.9rem] font-extrabold text-brand-blue-600">
        <span className="tnum">{amount}</span>
        {struck && <s className="tnum ml-2 text-base font-semibold text-ink-400">{struck}</s>}
      </p>
      <small className="text-ink-500">{note}</small>
      <ul className="mt-3.5 mb-5 text-[13.5px] text-ink-500">
        {points.map((p) => (
          <li key={p} className="flex gap-2 py-1">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-blue-600" aria-hidden />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {cta && (
        <Link href={cta.href} className={buttonClass(cta.secondary ? "secondary" : "primary", "md", "mt-auto w-full whitespace-normal text-center")}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function Gallery({ site }: Props) {
  return (
    <Section id="gallery" className="scroll-mt-12">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Gallery"
            icon={Images}
            title={site.gallery.title}
            action={
              <Link href="/events#past" className={buttonClass("secondary")}>
                Explore past editions
              </Link>
            }
          />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {site.gallery.images.map((src, i) => (
              <li
                key={src}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-white bg-brand-blue-50 shadow-[0_8px_22px_rgb(31_111_235/.12)]"
              >
                <Image
                  src={src}
                  alt={`Previous conference photo ${i + 1}`}
                  fill
                  sizes="(min-width: 768px) 380px, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Venue({ site }: Props) {
  const v = site.venueInfo;
  return (
    <Section id="venue" tone="soft" className="scroll-mt-12">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="Venue & accommodation" icon={MapPin} title={v.title} sub={v.sub} />
          <div className="grid gap-5 lg:grid-cols-[5fr_7fr]">
            <div className="grid place-items-center rounded-[20px] border-[6px] border-white bg-[linear-gradient(135deg,var(--color-brand-blue-50),#fff)] p-8 text-center shadow-[0_18px_40px_rgb(31_111_235/.15)]">
              <div>
                <MapPin className="mx-auto size-14 text-brand-blue-600" aria-hidden />
                <Eyebrow className="mt-4">Conference venue</Eyebrow>
                <h3 className="mt-3 text-xl font-extrabold">{v.name}</h3>
                <p className="mt-2 mb-5 text-ink-500">{v.address}</p>
                <a href={v.website} target="_blank" rel="noopener" className={buttonClass("secondary")}>
                  Hotel website <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            </div>
            <div className="min-h-[340px] overflow-hidden rounded-[20px] border-[6px] border-white shadow-[0_18px_40px_rgb(31_111_235/.15)]">
              <iframe
                src={v.mapEmbed}
                title={`Map: ${v.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-full min-h-[340px] w-full"
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function ContactFaq({ site }: Props) {
  const rows: { icon: LucideIcon; label: string; body: React.ReactNode }[] = [
    { icon: MapPin, label: "Office", body: `Alkali Manufacturers Association of India (AMAI), ${SECRETARIAT.address}` },
    { icon: UserRound, label: "Contact", body: SECRETARIAT.contactPerson },
    {
      icon: Phone,
      label: "Phone",
      body: SECRETARIAT.phones.map((p, i) => (
        <span key={p.tel}>
          {i > 0 && " · "}
          <a href={`tel:${p.tel}`} className="tnum hover:text-brand-blue-600">
            {p.label}
          </a>
        </span>
      )),
    },
    {
      icon: Mail,
      label: "Email",
      body: (
        <a href={`mailto:${SECRETARIAT.email}`} className="hover:text-brand-blue-600">
          {SECRETARIAT.email}
        </a>
      ),
    },
  ];
  return (
    <Section id="contact" className="scroll-mt-12">
      <Container>
        <Reveal className="grid gap-12 lg:grid-cols-[5fr_7fr]">
          <div>
            <Eyebrow icon={Mail}>Contact us</Eyebrow>
            <h2 className="mt-3.5 mb-2.5 text-[clamp(1.6rem,3vw,2.15rem)] font-extrabold">Get in touch</h2>
            <ul>
              {rows.map((r) => (
                <li key={r.label} className="flex items-start gap-3.5 py-3.5">
                  <IconTile icon={r.icon} className="size-[46px]" />
                  <div>
                    <b className="block text-sm text-ink-900">{r.label}</b>
                    <span className="text-sm text-ink-500">{r.body}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow icon={MessagesSquare}>FAQs</Eyebrow>
            <h2 className="mt-3.5 mb-6 text-[clamp(1.6rem,3vw,2.15rem)] font-extrabold">Frequently asked questions</h2>
            <Faq items={site.faqs} />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
