// Decorative benzene-ring lattice used behind heroes until AMAI supplies plant photography.
export function HexPattern({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={`absolute inset-0 -z-10 h-full w-full ${className}`}>
      <defs>
        <pattern id="hex" width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(1.1)">
          <path
            d="M28 0 L56 16.2 L56 48.5 L28 64.7 L0 48.5 L0 16.2 Z M28 64.7 L28 97"
            fill="none"
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="1.2"
          />
          <circle cx="28" cy="32.3" r="9" fill="none" stroke="#F5B23A" strokeOpacity="0.18" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}
