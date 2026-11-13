/**
 * Chaska Koyla Karahi identity: a karahi pot on coals — the wide two-handled pot the
 * dish is served in, with steam over a red disc. Same mark as the table QR menu.
 */
export const BRAND_NAME = 'Chaska Koyla Karahi'
export const BRAND_TAGLINE = 'Karahi & Charcoal Grill'

export function ChaskaMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="chaska-red" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#17824F" />
          <stop offset="0.5" stopColor="#0F5C3A" />
          <stop offset="1" stopColor="#0A3F28" />
        </linearGradient>
        <linearGradient id="chaska-red-bowl" x1="16" y1="26" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFAF6" />
          <stop offset="1" stopColor="#EFDFD1" />
        </linearGradient>
        <linearGradient id="chaska-red-curry" x1="21" y1="25" x2="43" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F2C273" />
          <stop offset="1" stopColor="#C98A3D" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="31" fill="url(#chaska-red)" />
      <circle cx="32" cy="32" r="29.1" fill="none" stroke="#FFF3E6" strokeOpacity="0.3" strokeWidth="1.2" />

      <path
        d="M27.4 20.4c-2.7-2.1 2.2-4.3 0-6.8"
        fill="none"
        stroke="#FFF3E6"
        strokeOpacity="0.92"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M36.6 20.4c-2.7-2.1 2.2-4.3 0-6.8"
        fill="none"
        stroke="#FFF3E6"
        strokeOpacity="0.92"
        strokeWidth="2.1"
        strokeLinecap="round"
      />

      <circle cx="12.4" cy="27.2" r="3.3" fill="none" stroke="#FFF3E6" strokeWidth="2.1" />
      <circle cx="51.6" cy="27.2" r="3.3" fill="none" stroke="#FFF3E6" strokeWidth="2.1" />

      <path d="M15.6 27.2c0 8.6 7.3 15.2 16.4 15.2s16.4-6.6 16.4-15.2z" fill="url(#chaska-red-bowl)" />
      <ellipse cx="32" cy="27.2" rx="16.4" ry="3.3" fill="#FFF6EE" />
      <ellipse cx="32" cy="27.2" rx="12.6" ry="2.3" fill="url(#chaska-red-curry)" />
      <circle cx="27.6" cy="27.2" r="1.15" fill="#3F7A3F" />
      <circle cx="35.4" cy="27.5" r="0.95" fill="#3F7A3F" />

      <path d="M25.4 45.4h13.2" stroke="#FFF3E6" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ size = 'md', stacked = false, onDark = false }) {
  const nameSize = size === 'lg' ? 'text-3xl' : 'text-xl'
  const dishSize = size === 'lg' ? 'text-2xl' : 'text-lg'
  const subSize = size === 'lg' ? 'tracking-[0.42em] text-xs' : 'tracking-[0.32em] text-[10px]'
  const markSize = size === 'lg' ? 'h-14 w-14' : 'h-9 w-9'

  const wordmark = (
    <div className={`flex flex-col leading-none ${stacked ? 'items-center' : 'items-start'}`}>
      <span className={`font-display font-bold tracking-tight ${nameSize} ${onDark ? 'text-white' : 'text-lex-ink'}`}>
        Chaska
      </span>
      <span
        className={`mt-1 font-display font-bold tracking-tight ${dishSize} ${
          onDark ? 'text-lex-gold-pale' : 'lex-gold-text'
        }`}
      >
        Koyla Karahi
      </span>
      <span className={`mt-1.5 font-sans font-semibold uppercase ${subSize} ${onDark ? 'text-white/55' : 'text-lex-faint'}`}>
        Food POS
      </span>
    </div>
  )

  if (stacked) {
    return (
      <div className="flex flex-col items-center gap-3.5 leading-none select-none">
        <ChaskaMark className={`${markSize} drop-shadow-[0_4px_14px_rgba(15,92,58,0.28)]`} />
        {wordmark}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 leading-none select-none">
      <ChaskaMark className={`${markSize} shrink-0`} />
      {wordmark}
    </div>
  )
}
