import type { ReactNode } from "react";

// lucide-react 1.x ships no brand marks, so the ai_site social icons are drawn inline.
const ICONS: Record<string, ReactNode> = {
  LinkedIn: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4z" />
  ),
  X: (
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />
  ),
  Facebook: <path d="M13.5 21v-7.5h2.6l.4-3.2h-3V8.3c0-.9.3-1.6 1.6-1.6h1.6V3.9a22 22 0 0 0-2.4-.1c-2.4 0-4 1.5-4 4.1v2.4H7.6v3.2h2.7V21z" />,
  Instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </g>
  ),
  YouTube: (
    <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.75 15.02V8.98L15.5 12z" />
  ),
};

export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/amai-india/" },
  { label: "X", href: "https://twitter.com/amai_india" },
  { label: "Facebook", href: "https://www.facebook.com/amai.india" },
  { label: "Instagram", href: "https://www.instagram.com/amai.india/" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCJQUXpEZ7qULElaCUJw4M0w" },
];

// ai_soc
export function SocialLinks() {
  return (
    <ul className="flex flex-wrap gap-2">
      {SOCIAL_LINKS.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener"
            aria-label={s.label}
            className="grid size-[38px] place-items-center rounded-full border border-line-200 bg-white text-brand-blue-600 transition-colors hover:bg-brand-blue-600 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              {ICONS[s.label]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
