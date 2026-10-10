export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#f5a300" />
      <path d="M36 8 16 36h14l-4 20 22-30H34z" fill="#1b1f23" />
    </svg>
  );
}

export function PersonWithCable() {
  return (
    <svg viewBox="0 0 300 420" className="h-full w-auto" aria-hidden="true">
      <defs>
        <radialGradient id="pg" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f5a300" stopOpacity=".35" />
          <stop offset="1" stopColor="#f5a300" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="170" cy="220" r="190" fill="url(#pg)" />
      <path d="M98 300h50v112H98zM152 300h50v112h-50z" fill="#242a31" />
      <path d="M100 150 78 250" stroke="#2f363e" strokeWidth="28" strokeLinecap="round" fill="none" />
      <path d="M92 140Q150 118 208 140L222 305H78Z" fill="#2f363e" />
      <path d="M118 135 126 305M182 135 174 305" stroke="#f5a300" strokeWidth="9" opacity=".9" />
      <rect x="138" y="105" width="24" height="24" fill="#3a424b" />
      <circle cx="150" cy="84" r="31" fill="#3a424b" />
      <path d="M113 78a37 34 0 0 1 74 0z" fill="#f5a300" />
      <rect x="105" y="76" width="90" height="9" rx="4" fill="#d98f00" />
      <path d="M204 152 252 205 246 150" stroke="#2f363e" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="246" cy="146" r="15" fill="#3a424b" />
      <ellipse cx="246" cy="132" rx="27" ry="15" fill="none" stroke="#f5a300" strokeWidth="5" />
      <ellipse cx="250" cy="126" rx="24" ry="13" fill="none" stroke="#f5a300" strokeWidth="5" />
      <path d="M268 140C305 200 268 290 284 378" stroke="#f5a300" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="270" y="376" width="28" height="30" rx="5" fill="#d9dde1" />
      <rect x="277" y="406" width="4" height="12" fill="#d9dde1" />
      <rect x="287" y="406" width="4" height="12" fill="#d9dde1" />
      <path d="M292 352 280 372h9l-4 14 14-20h-9z" fill="#ffe27a" />
    </svg>
  );
}
