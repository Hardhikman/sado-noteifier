export function SadoLogo() {
  return (
    <div className="flex items-center justify-center">
      {/* Container for text and brush */}
      <div className="relative inline-block">
        {/* Horizontal Pen - positioned above text, fitted to word width */}
        <svg
          width="220"
          height="80"
          viewBox="0 0 220 80"
          className="text-[#A63637] absolute -top-6 left-0"
          fill="currentColor"
        >
          {/* Pen nib - pointed tip */}
          <polygon points="28,32 35,28 35,36" fill="currentColor" />

          {/* Pen barrel - main cylindrical body (reduced length and height) */}
          <rect x="35" y="28" width="50" height="8" rx="2" fill="currentColor" />

          {/* Pen cap/ferrule - ribbed section (reduced size) */}
          <rect x="85" y="27" width="10" height="10" rx="1" fill="currentColor" opacity="0.9" />
          <line x1="87" y1="27" x2="87" y2="37" stroke="white" strokeWidth="1" opacity="0.6" />
          <line x1="90" y1="27" x2="90" y2="37" stroke="white" strokeWidth="1" opacity="0.6" />

          {/* Pen clip (smaller) */}
          <path
            d="M 95 22 Q 97 19 99 22 L 99 25"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Decorative highlight lines on barrel (shortened) */}
          <line x1="45" y1="32" x2="65" y2="32" stroke="white" strokeWidth="1.5" opacity="0.4" />
        </svg>

        {/* Text - SaDo */}
        <div className="flex items-center gap-0">
          <span className="text-4xl font-serif font-bold text-[#A63637] leading-none">Sa</span>
          <span className="text-4xl font-serif font-bold text-[#A63637] leading-none">Do</span>
        </div>
      </div>
    </div>
  )
}