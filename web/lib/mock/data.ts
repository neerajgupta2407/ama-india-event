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
  // Copy, fees, venue and FAQs from the 2027 conference microsite (ai_site/index.html).
  // The registration close date is a placeholder; AMAI has not announced the early-bird deadline yet.
  {
    slug: "alkali-industry-conference-2027",
    title: "12th AMAI Alkali Industry Conference 2027",
    shortTitle: "Conference 2027",
    tagline: "Shaping a Competitive, Sustainable and Resilient Future",
    summary:
      "Global energy experts, technology licensors, equipment suppliers, Indian and international producers, regulators and sustainability leaders meet for two days on markets, technology and decarbonisation.",
    startsAt: "2027-01-28T09:30:00+05:30",
    endsAt: "2027-01-29T17:30:00+05:30",
    venue: "Hotel Andaz by Hyatt, Aerocity",
    city: "New Delhi",
    status: "open",
    registrationPrefix: "AC27",
    registrationClosesAt: "2027-01-21T23:59:00+05:30",
    categories: [
      {
        id: "ac27-member",
        code: "MEMBER",
        name: "Member delegate",
        audience: "MEMBER",
        description: "Employees of AMAI member companies. We verify your membership during registration.",
        baseAmountPaise: 3_000_000,
        gstRate: 18,
        capacity: null,
        seatsTaken: 0,
        requiresMemberValidation: true,
      },
      {
        id: "ac27-nonmember",
        code: "NON_MEMBER",
        name: "Non-member delegate",
        audience: "NON_MEMBER",
        description: "Indian participants from non-member organisations.",
        baseAmountPaise: 3_500_000,
        gstRate: 18,
        capacity: null,
        seatsTaken: 0,
        requiresMemberValidation: false,
      },
    ],
    agenda: [],
    speakers: [],
    highlights: [],
    microsite: {
      edition: "12th edition",
      heroTitle: ["AMAI Alkali Industry", "Conference 2027"],
      heroImage: "/images/conference-2027/banner/banner1.jpg",
      about: {
        title: "India's alkali industry at an inflection point",
        body: "With rising domestic demand, major new capacity additions and a growing emphasis on sustainability and energy transition, the AMAI Annual Alkali Industry Conference & Exhibition brings together global energy experts, safety professionals, technology licensors, equipment suppliers, Indian and international producers, logistics specialists, regulators and sustainability leaders.",
        image: "/images/conference-2027/home/abt-img.jpg",
        focusTitle: "The two-day conference will focus on:",
        focus: [
          "Economy and trends impacting Indian alkali industry performance",
          "Global and Indian chlor-alkali & soda ash market outlook",
          "Capacity expansions in India and consumer industry dynamics",
          "Cost drivers: power, energy, logistics and raw materials",
          "Salt policy, supply uncertainties & risk mitigation",
          "Technology advances in electrolysis, membranes and green chemistry",
          "Decarbonisation, safety and emergency response",
          "Indian alkali industry — the way forward",
        ],
        note: "Focus areas shown are from the previous edition; the 2027 programme will be confirmed soon.",
      },
      whyAttend: {
        title: "Four reasons to be in the room",
        sub: "Evaluate market shifts, assess new technology options, explore strategic opportunities and build deeper industry collaborations.",
        items: [
          { title: "Market insights", text: "Clear view of trends, drivers and opportunities across the alkali industry." },
          { title: "Technology exchange", text: "Explore the latest innovations and best practices." },
          { title: "Industry connections", text: "Build valuable relationships across the global value chain." },
          { title: "Sustainable growth", text: "Discuss solutions for a competitive, sustainable future." },
        ],
      },
      themes: {
        title: "Markets · Technology · Sustainability",
        note: "Illustrative themes",
        items: [
          { title: "Markets", text: "Global market dynamics, demand outlooks and emerging opportunities.", image: "/images/conference-2027/home/1-f.jpg" },
          { title: "Technology", text: "Innovation, process efficiency and operational excellence.", image: "/images/conference-2027/home/2-f.jpg" },
          { title: "Sustainability", text: "Pathways to a lower-carbon, more resource-efficient future.", image: "/images/conference-2027/home/3-f.jpg" },
        ],
      },
      days: [
        {
          date: "2027-01-28",
          label: "Day 1 · Thursday",
          summary: "Key industry themes with expert insights and panel discussions. Detailed agenda will be shared soon.",
          tags: ["Markets", "Keynotes", "Panels"],
        },
        {
          date: "2027-01-29",
          label: "Day 2 · Friday",
          summary: "Continuation of the programme with further insights, case studies and discussion.",
          tags: ["Technology", "Case studies", "Networking"],
        },
      ],
      speakersNote: "2027 speakers will be announced",
      participate: [
        {
          title: "Exhibit at AMAI 2027",
          text: "Showcase your expertise, connect with key decision-makers and raise your profile across the alkali industry.",
          image: "/images/conference-2027/home/4-f.jpg",
          cta: "Enquire now",
          href: "/contact?topic=events",
        },
        {
          title: "Become a partner",
          text: "Align your organisation with a trusted industry platform and demonstrate your commitment to the alkali industry.",
          image: "/images/conference-2027/home/5-f.jpg",
          cta: "Enquire now",
          href: "/contact?topic=events",
        },
      ],
      organisations: {
        title: "Trusted by industry leaders",
        sub: "Confirmed 2027 participants coming soon. Organisations from the 2026 edition:",
        logos: [
          { name: "Descote", image: "/images/conference-2027/leaders/1.jpg" },
          { name: "Yug Enterprise", image: "/images/conference-2027/leaders/2.jpg" },
          { name: "Sescon", image: "/images/conference-2027/leaders/3.jpg" },
          { name: "Asahi Kasei", image: "/images/conference-2027/leaders/4.jpg" },
          { name: "JMC", image: "/images/conference-2027/leaders/5.jpg" },
          { name: "CPP", image: "/images/conference-2027/leaders/6.jpg" },
        ],
      },
      offlineFees: [
        {
          name: "International delegates",
          amount: "US$ 900",
          note: "per foreign participant",
          points: [
            "For foreign participants (non-member registration)",
            "10% multiple-delegate and early-bird discounts as per the registration form",
          ],
          href: "/contact?topic=events",
        },
      ],
      feePoints: [
        "10% multiple-delegate discount for 3 or more participants from the same organisation",
        "10% early-bird discount on registration fee (deadline to be announced)",
      ],
      gallery: {
        title: "Previous conference highlights",
        images: [1, 2, 3, 4, 5, 6].map((n) => `/images/conference-2027/gallery/${n}.jpg`),
      },
      venueInfo: {
        title: "Hotel Andaz by Hyatt, Aerocity, New Delhi",
        sub: "The 12th AMAI Alkali Industry Conference will be held on 28–29 January 2027 (Thursday & Friday). Further information on accommodation options and travel guidance will be provided in due course.",
        name: "Andaz by Hyatt, Aerocity",
        address: "Andaz Delhi, Asset No. 1, Aerocity, New Delhi – 110037, India",
        website: "https://www.hyatt.com/andaz/delaz-andaz-delhi",
        mapEmbed:
          "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.5125372575567!2d77.11870727549798!3d28.554368175707513!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1c68e56ccff3%3A0x377c64cf8683b859!2sAndaz%20Delhi%2C%20by%20Hyatt!5e0!3m2!1sen!2sin!4v1765434052256!5m2!1sen!2sin",
      },
      faqs: [
        {
          q: "When is the conference?",
          a: "The 12th AMAI Alkali Industry Conference, “Shaping a Competitive, Sustainable and Resilient Future”, will be held on 28 & 29 January 2027 (Thursday & Friday) at Hotel Andaz by Hyatt, Aerocity, New Delhi.",
        },
        { q: "When will the programme be announced?", a: "The 2027 programme will be published here as soon as it is confirmed." },
        {
          q: "How do I register for the conference?",
          a: "Choose Member or Non-member delegate in the Registration section and complete the online form and payment. Participation charges are ₹30,000 + GST for members and ₹35,000 + GST for non-members per participant. Foreign participants (US$ 900) should contact the secretariat.",
        },
        {
          q: "Are there any registration discounts?",
          a: "Yes — a 10% multiple-delegate discount applies for 3 or more participants registering from the same organisation, and a 10% early-bird discount is available on the registration fee (early-bird deadline to be announced by AMAI).",
        },
        { q: "Will there be exhibition opportunities?", a: "Yes — use “Enquire now” in the Participate section to express interest." },
        { q: "How can I stay updated?", a: "Write to hkanand@ama-india.org and we will share announcements by email." },
      ],
    },
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

// Secretariat contact as published on the 2027 conference microsite (ai_site/index.html).
export const SECRETARIAT = {
  address:
    "Office nos. 1009-1010, 10th Floor, Amba Deep Building, 14 Kasturba Gandhi Marg, New Delhi-110001",
  contactPerson: "Ms. Harjeet Kaur Anand, Director",
  phones: [
    { label: "011-4302 7119", tel: "01143027119" },
    { label: "+91 98189 04989", tel: "+919818904989" },
  ],
  email: "hkanand@ama-india.org",
  cern: { label: "1800-11-1735", tel: "1800111735" },
};

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

export const FEATURED_EVENT_SLUG = "alkali-industry-conference-2027";

export const CAMPAIGN_LINKS: Record<string, { event: string; source: string; campaign: string }> = {
  "ac26-poster": { event: "annual-conference-2026", source: "poster", campaign: "ac26" },
  "ac26-bulletin": { event: "annual-conference-2026", source: "alkali-bulletin", campaign: "ac26" },
  "ac27-poster": { event: "alkali-industry-conference-2027", source: "poster", campaign: "ac27" },
  "cst26-flyer": { event: "chlorine-safety-training-2026", source: "flyer", campaign: "cst26" },
};

export const getEvent = (slug: string) => EVENTS.find((e) => e.slug === slug);
export const upcomingEvents = () => EVENTS.filter((e) => e.status === "open");
export const pastEvents = () => EVENTS.filter((e) => e.status === "archived" || e.status === "closed");
