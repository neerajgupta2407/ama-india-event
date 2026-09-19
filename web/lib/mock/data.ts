// Dummy data for the frontend prototype. Nothing here is live AMAI data except the public
// news headlines and important links, which were copied from ama-india.org on 18 Sep 2026.
import type { AmaiEvent, NewsItem, Publication } from "../types";

export const EVENTS: AmaiEvent[] = [
  {
    slug: "annual-conference-2026",
    title: "AMAI Annual Conference 2026",
    shortTitle: "Annual Conference",
    tagline: "Chlor-alkali in a decarbonising economy",
    summary:
      "Two days of technical sessions, market outlooks and plant-safety case studies with producers, regulators and technology partners from across the Indian alkali industry.",
    startsAt: "2026-11-19T09:30:00+05:30",
    endsAt: "2026-11-20T17:30:00+05:30",
    venue: "Grand Hyatt, Santacruz East",
    city: "Mumbai",
    status: "open",
    registrationPrefix: "AC26",
    registrationClosesAt: "2026-11-12T23:59:00+05:30",
    categories: [
      {
        id: "ac26-member",
        code: "MEMBER",
        name: "Member delegate",
        audience: "MEMBER",
        description: "Employees of AMAI member companies. We verify your membership during registration.",
        baseAmountPaise: 1_200_000,
        earlyBirdAmountPaise: 1_000_000,
        earlyBirdUntil: "2026-10-15T23:59:00+05:30",
        gstRate: 18,
        capacity: 400,
        seatsTaken: 238,
        requiresMemberValidation: true,
      },
      {
        id: "ac26-nonmember",
        code: "NON_MEMBER",
        name: "Non-member delegate",
        audience: "NON_MEMBER",
        description: "Industry professionals, consultants, suppliers and government participants.",
        baseAmountPaise: 1_800_000,
        earlyBirdAmountPaise: 1_550_000,
        earlyBirdUntil: "2026-10-15T23:59:00+05:30",
        gstRate: 18,
        capacity: 200,
        seatsTaken: 121,
        requiresMemberValidation: false,
      },
      {
        id: "ac26-student",
        code: "STUDENT",
        name: "Student / academic",
        audience: "STUDENT",
        description: "Full-time students and faculty. Carry a valid institute ID to the venue.",
        baseAmountPaise: 300_000,
        gstRate: 18,
        capacity: 40,
        seatsTaken: 36,
        requiresMemberValidation: false,
      },
    ],
    agenda: [
      { time: "09:30", title: "Registration & networking breakfast" },
      { time: "10:30", title: "Inaugural session and President's address", speaker: "President, AMAI" },
      { time: "11:30", title: "Caustic soda & PVC demand outlook 2027–30", speaker: "Market analyst panel" },
      { time: "14:00", title: "Membrane cell upgrades: energy per tonne case studies" },
      { time: "15:30", title: "Chlorine transport safety & CERN learnings", speaker: "AMAI SHE Committee" },
      { time: "17:00", title: "Green hydrogen from chlor-alkali by-product streams" },
    ],
    speakers: [
      { name: "Speaker to be announced", role: "President", org: "AMAI" },
      { name: "Speaker to be announced", role: "Keynote", org: "Ministry of Chemicals & Fertilizers" },
      { name: "Speaker to be announced", role: "Technology partner", org: "Membrane technology provider" },
      { name: "Speaker to be announced", role: "Chair, SHE Committee", org: "AMAI" },
    ],
    highlights: ["2 days · 14 sessions", "600+ delegates", "Plant-safety awards", "Exhibition hall"],
  },
  {
    slug: "chlorine-safety-training-2026",
    title: "Safe Handling of Chlorine & Emergency Preparedness",
    shortTitle: "Chlorine Safety Training",
    tagline: "Hands-on training programme for plant and logistics teams",
    summary:
      "A one-day programme covering chlorine properties, tonner and cylinder handling, leak control kits, emergency response and the CERN helpline process.",
    startsAt: "2026-10-08T09:00:00+05:30",
    endsAt: "2026-10-08T17:30:00+05:30",
    venue: "GIDC Training Centre",
    city: "Vadodara",
    status: "open",
    registrationPrefix: "CST26",
    registrationClosesAt: "2026-10-03T23:59:00+05:30",
    categories: [
      {
        id: "cst26-member",
        code: "MEMBER",
        name: "Member company participant",
        audience: "MEMBER",
        description: "Employees of AMAI member companies.",
        baseAmountPaise: 450_000,
        gstRate: 18,
        capacity: 60,
        seatsTaken: 52,
        requiresMemberValidation: true,
      },
      {
        id: "cst26-nonmember",
        code: "NON_MEMBER",
        name: "Non-member participant",
        audience: "NON_MEMBER",
        description: "Chlorine users, transporters, consumers and emergency services.",
        baseAmountPaise: 650_000,
        gstRate: 18,
        capacity: 30,
        seatsTaken: 30,
        requiresMemberValidation: false,
      },
    ],
    agenda: [
      { time: "09:00", title: "Chlorine properties & hazards" },
      { time: "10:30", title: "Tonner and cylinder handling" },
      { time: "12:00", title: "Emergency kits: live demonstration" },
      { time: "14:30", title: "Emergency response & CERN 1800-11-1735" },
      { time: "16:30", title: "Assessment and certificates" },
    ],
    speakers: [{ name: "Faculty to be announced", role: "Trainer", org: "AMAI SHE Committee" }],
    highlights: ["1 day", "Certificate", "Live leak-kit demo", "Limited seats"],
  },
  {
    slug: "membrane-technology-seminar-2026",
    title: "Technical Seminar on Membrane Cell Technology",
    shortTitle: "Membrane Seminar",
    tagline: "Efficiency, recoating cycles and energy benchmarking",
    summary: "A half-day seminar for plant engineers on membrane performance, element recoating and energy benchmarking.",
    startsAt: "2026-12-10T10:00:00+05:30",
    endsAt: "2026-12-10T14:00:00+05:30",
    venue: "India Habitat Centre",
    city: "New Delhi",
    status: "open",
    registrationPrefix: "MTS26",
    registrationClosesAt: "2026-12-05T23:59:00+05:30",
    categories: [
      {
        id: "mts26-member",
        code: "MEMBER",
        name: "Member delegate",
        audience: "MEMBER",
        description: "Employees of AMAI member companies.",
        baseAmountPaise: 250_000,
        gstRate: 18,
        capacity: null,
        seatsTaken: 44,
        requiresMemberValidation: true,
      },
      {
        id: "mts26-nonmember",
        code: "NON_MEMBER",
        name: "Non-member delegate",
        audience: "NON_MEMBER",
        description: "Everyone else.",
        baseAmountPaise: 400_000,
        gstRate: 18,
        capacity: null,
        seatsTaken: 12,
        requiresMemberValidation: false,
      },
    ],
    agenda: [
      { time: "10:00", title: "Membrane performance monitoring" },
      { time: "11:15", title: "Element recoating: when and why" },
      { time: "12:30", title: "Energy benchmarking across Indian plants" },
    ],
    speakers: [],
    highlights: ["Half day", "Plant engineers", "Benchmark report"],
  },
  {
    slug: "agm-2025",
    title: "Annual General Meeting 2025",
    shortTitle: "AGM 2025",
    tagline: "Members only",
    summary: "Annual General Meeting of the Association and election of office bearers for 2025–26.",
    startsAt: "2025-09-26T10:00:00+05:30",
    endsAt: "2025-09-26T16:00:00+05:30",
    venue: "Holiday Inn, Aerocity",
    city: "New Delhi",
    status: "archived",
    registrationPrefix: "AGM25",
    registrationClosesAt: "2025-09-20T23:59:00+05:30",
    categories: [],
    agenda: [],
    speakers: [],
    highlights: [],
  },
];

export type MemberOrg = {
  name: string;
  memberNumber: string;
  domains: string[];
  status: "active" | "lapsed";
};

// Dummy member numbers; names follow the member logo wall on ama-india.org.
export const MEMBER_ORGS: MemberOrg[] = [
  { name: "Tata Chemicals Ltd", memberNumber: "AMAI-M-0001", domains: ["tatachemicals.com"], status: "active" },
  { name: "Gujarat Alkalies and Chemicals Ltd", memberNumber: "AMAI-M-0002", domains: ["gacl.co.in"], status: "active" },
  { name: "Aditya Birla Chemicals", memberNumber: "AMAI-M-0003", domains: ["adityabirla.com"], status: "active" },
  { name: "DCM Shriram Ltd", memberNumber: "AMAI-M-0007", domains: ["dcmshriram.com"], status: "active" },
  { name: "Chemplast Sanmar Ltd", memberNumber: "AMAI-M-0011", domains: ["sanmargroup.com"], status: "active" },
  { name: "Nirma Ltd", memberNumber: "AMAI-M-0015", domains: ["nirma.co.in"], status: "lapsed" },
  { name: "Chemfab Alkalis Ltd", memberNumber: "AMAI-M-0019", domains: ["chemfabalkalis.com"], status: "active" },
  { name: "Bodal Chemicals Ltd", memberNumber: "AMAI-M-0024", domains: ["bodal.com"], status: "active" },
];

export const NEWS: NewsItem[] = [
  { date: "2026-09-02", title: "Conference 2026: presentations, photos and feedback form", href: "#", kind: "link" },
  { date: "2026-05-28", title: "Alkali Bulletin, May 2026 issue released", href: "#", kind: "pdf" },
  { date: "2026-04-10", title: "Members Directory 2026 released. Order your copy from the Secretariat", href: "#" },
  { date: "2026-03-15", title: "AMAI Annual Industry Review 2024–25 released", href: "#", kind: "pdf" },
  { date: "2025-09-27", title: "Press release: election of office bearers for AGM 2025–26", href: "#", kind: "pdf" },
];

export const SHE_ITEMS = [
  "For any chlorine emergency, anywhere in India, dial the Chlorine Emergency Response Number (CERN) 1800-11-1735, an AMAI initiative.",
  "Request a training programme on Safe Handling of Chlorine and Emergency Preparedness.",
  "Mock drills, leak-kit distribution and transporter awareness programmes across producing states.",
];

export const PUBLICATIONS: Publication[] = [
  { title: "Annual Industry Review", issue: "2024–25", kind: "Report", cover: "blue" },
  { title: "Members Directory", issue: "2026", kind: "Directory", cover: "indigo" },
  { title: "Alkali Bulletin", issue: "May 2026", kind: "Bulletin", cover: "amber" },
];

export const IMPORTANT_LINKS = [
  "Department of Chemicals & Petrochemicals, Govt. of India",
  "Bureau of Energy Efficiency",
  "Bureau of Indian Standards",
  "Central Pollution Control Board",
  "Ministry of Environment, Forest and Climate Change",
  "Department for Promotion of Industry and Internal Trade",
  "World Chlorine Council",
  "The Chlorine Institute",
  "Euro Chlor",
];

// Illustrative only; replace with AMAI's published Industry Data.
export const SAMPLE_STATS = [
  { value: "5.9 Mt", label: "Caustic soda capacity", note: "Sample figure" },
  { value: "4.2 Mt", label: "Soda ash capacity", note: "Sample figure" },
  { value: "38", label: "Member companies", note: "Sample figure" },
  { value: "24×7", label: "CERN chlorine helpline", note: "1800-11-1735" },
];

export const CAMPAIGN_LINKS: Record<string, { event: string; source: string; campaign: string }> = {
  "ac26-poster": { event: "annual-conference-2026", source: "poster", campaign: "ac26" },
  "ac26-bulletin": { event: "annual-conference-2026", source: "alkali-bulletin", campaign: "ac26" },
  "cst26-flyer": { event: "chlorine-safety-training-2026", source: "flyer", campaign: "cst26" },
};

export const getEvent = (slug: string) => EVENTS.find((e) => e.slug === slug);
export const upcomingEvents = () => EVENTS.filter((e) => e.status === "open");
export const pastEvents = () => EVENTS.filter((e) => e.status === "archived" || e.status === "closed");
