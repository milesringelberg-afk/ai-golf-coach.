// Minimale, lijngebaseerde iconenset. Alles gebruikt currentColor zodat de
// kleur meekomt met de tekst, en strokeWidth blijft dun voor de
// instrument-achtige uitstraling.
const PATHS = {
  swing: (
    <>
      <path d="M6 21V3" />
      <path d="M6 3l11 4-11 4" />
    </>
  ),
  stats: (
    <>
      <path d="M3 21h18" />
      <path d="M6 17V10" />
      <path d="M11 17V5" />
      <path d="M16 17v-4" />
      <path d="M21 17v-9" />
    </>
  ),
  history: (
    <>
      <path d="M3 7h7l2 2h9v10H3z" />
      <path d="M3 7V5h6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7.5v.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9" />
      <path d="M17 12v4" />
      <path d="M20 12v3" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="12" height="12" />
      <path d="M15 10l6-3v10l-6-3z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 17V4" />
      <path d="M6 10l6-6 6 6" />
      <path d="M3 20h18" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  alert: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5" />
      <path d="M12 18v.5" />
    </>
  ),
  analysis: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l5 5" />
      <path d="M8 11h6" />
      <path d="M11 8v6" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5V15h8v-1.5A6 6 0 0 0 12 3z" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 9.5a4 4 0 0 1 0 5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <path d="M8 4v16" />
      <path d="M16 4v16" />
    </>
  ),
  skeleton: (
    <>
      <circle cx="12" cy="4.5" r="2.5" />
      <path d="M12 7v6" />
      <path d="M7 9.5h10" />
      <path d="M12 13l-3 7" />
      <path d="M12 13l3 7" />
    </>
  ),
  angle: (
    <>
      <path d="M4 20h16" />
      <path d="M4 20L16 5" />
      <path d="M10 20a7 7 0 0 0 1.2-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v6" />
      <path d="M15 3v6" />
      <path d="M6 9h12v3a6 6 0 0 1-12 0z" />
      <path d="M12 18v3" />
    </>
  ),
  folder: (
    <>
      <path d="M3 6h6l2 2h10v11H3z" />
    </>
  ),
};

export default function Icon({ name, size = 18, className = "", strokeWidth = 1.5 }) {
  const content = PATHS[name];
  if (!content) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}
