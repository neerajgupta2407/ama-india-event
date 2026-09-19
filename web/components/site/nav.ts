export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

// Keeps the current ama-india.org information architecture (DESIGN_SYSTEM.md §5.1).
export const NAV: NavItem[] = [
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About AMAI", href: "/about" },
      { label: "History", href: "/about/history" },
      { label: "Executive Committee", href: "/about/executive-committee" },
      { label: "Past Presidents", href: "/about/past-presidents" },
      { label: "Governance & Compliance", href: "/about/compliance" },
    ],
  },
  {
    label: "Members",
    href: "/members",
    children: [
      { label: "List of Members", href: "/members" },
      { label: "Plant Locations", href: "/members/plant-locations" },
      { label: "Become a member", href: "/contact?topic=membership" },
    ],
  },
  {
    label: "Events",
    href: "/events",
    children: [
      { label: "Upcoming Events", href: "/events" },
      { label: "Past Events", href: "/events#past" },
    ],
  },
  {
    label: "Publications",
    href: "/publications",
    children: [
      { label: "Alkali Bulletin", href: "/publications/bulletin" },
      { label: "Annual Industry Review", href: "/publications" },
      { label: "Members Directory", href: "/publications" },
    ],
  },
  { label: "Industry Data", href: "/industry-data" },
  { label: "Media", href: "/media" },
  { label: "Chlorine World", href: "/chlorine-world" },
  { label: "SHE", href: "/she" },
];
