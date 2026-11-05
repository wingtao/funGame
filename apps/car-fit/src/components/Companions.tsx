export function Companions({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={compact ? 'companions compact' : 'companions'}
      viewBox="0 0 580 340"
      role="img"
      aria-label="薄荷绿小车和橙色钱包一起规划买车生活"
    >
      <ellipse cx="288" cy="298" rx="222" ry="16" fill="#e9deca" />
      <path
        d="M29 290h500"
        stroke="#352c28"
        strokeWidth="3"
        strokeDasharray="10 10"
      />
      <g
        className="car-bob"
        stroke="#352c28"
        strokeWidth="4"
        strokeLinejoin="round"
      >
        <path
          d="M61 200l27-72q6-16 28-16h151q17 0 28 17l43 69q34 1 35 25v43H48v-40q0-19 13-26z"
          fill="#bfe7d3"
        />
        <path
          d="M108 129h68v63H85zM193 129h62q12 0 19 12l32 51H193z"
          fill="#fffdf6"
        />
        <path d="M195 214h22" strokeLinecap="round" />
        <rect x="48" y="221" width="29" height="19" rx="8" fill="#fff0b9" />
        <rect x="345" y="220" width="28" height="20" rx="7" fill="#eeb69e" />
        <circle cx="113" cy="264" r="34" fill="#5a5148" />
        <circle cx="113" cy="264" r="15" fill="#fff8ee" />
        <circle cx="301" cy="264" r="34" fill="#5a5148" />
        <circle cx="301" cy="264" r="15" fill="#fff8ee" />
        <path
          d="M151 226v6M226 226v6M181 237q11 11 22 0"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M261 104l-10-20M289 111l12-17"
          stroke="#ba9762"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g
        className="wallet-bob"
        stroke="#352c28"
        strokeWidth="4"
        strokeLinejoin="round"
      >
        <path d="M368 172q-8-10 6-23l93-39q11-4 15 8l17 49" fill="#e8a96b" />
        <path d="M400 146l13-60l49 11l-12 58" fill="#d7e5bc" />
        <path d="M416 99l28 7" stroke="#819268" />
        <rect x="353" y="155" width="160" height="116" rx="18" fill="#ffc47a" />
        <path d="M482 186h39v41h-39q-12-20 0-41z" fill="#edab5b" />
        <circle cx="502" cy="207" r="4" fill="#352c28" />
        <path
          d="M379 195v7M431 195v7M396 218q10 9 18 0"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M379 271l-6 22M463 271l9 22M353 225l-20-9M516 245l19-13"
          strokeLinecap="round"
        />
      </g>
      <g fill="#ffc47a" stroke="#352c28" strokeWidth="2">
        <path d="M83 63l4-15l5 15l15 4l-15 5l-5 15l-4-15l-15-5z" />
        <path d="M526 118l3-10l4 10l10 4l-10 3l-4 11l-3-11l-11-3z" />
      </g>
      <path
        d="M318 63q15-19 28 0q15-19 28 0q4 20-28 38q-31-20-28-38"
        fill="#efbea8"
        stroke="#352c28"
        strokeWidth="3"
      />
    </svg>
  );
}
