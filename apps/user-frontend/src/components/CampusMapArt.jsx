// Decorative campus map used on the login screens and dashboard hero.
// Pure SVG: buildings, a dashed route that "walks" to a pulsing destination pin.
export default function CampusMapArt({ className = '' }) {
  return (
    <svg viewBox="0 0 600 480" className={className} fill="none" aria-hidden="true">
      {/* Buildings */}
      <g fill="#ffffff" fillOpacity="0.07" stroke="#ffffff" strokeOpacity="0.2">
        <rect x="40" y="50" width="120" height="80" rx="14" />
        <rect x="200" y="30" width="90" height="110" rx="14" />
        <rect x="330" y="60" width="140" height="70" rx="14" />
        <rect x="500" y="40" width="70" height="120" rx="14" />
        <rect x="60" y="200" width="100" height="120" rx="14" />
        <rect x="210" y="220" width="130" height="90" rx="14" />
        <rect x="390" y="200" width="80" height="130" rx="14" />
        <rect x="500" y="230" width="80" height="80" rx="40" />
        <rect x="40" y="375" width="150" height="70" rx="14" />
        <rect x="250" y="375" width="110" height="75" rx="14" />
        <rect x="420" y="385" width="150" height="55" rx="14" />
      </g>

      {/* Route */}
      <path
        d="M60 180 H182 V350 H367 V180 H487 V350"
        stroke="#F2E6B8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="route-dash"
      />
      <circle cx="60" cy="180" r="6" fill="#8B353D" stroke="#F2E6B8" strokeWidth="3" />

      {/* Destination pin */}
      <ellipse cx="487" cy="350" rx="11" ry="4.5" fill="#F2E6B8" fillOpacity="0.9" className="pin-pulse" />
      <ellipse cx="487" cy="350" rx="6" ry="2.5" fill="#000000" fillOpacity="0.25" />
      <g transform="translate(487 332)">
        <path
          d="M0 -26 C-10 -26 -16 -18 -16 -10 C-16 2 0 18 0 18 C0 18 16 2 16 -10 C16 -18 10 -26 0 -26 Z"
          fill="#F2E6B8"
        />
        <circle cx="0" cy="-10" r="5.5" fill="#8B353D" />
      </g>
    </svg>
  );
}
