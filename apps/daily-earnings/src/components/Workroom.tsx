import type { WorkState } from '../domain/earnings';
export function Workroom({
  state = 'working',
  paused = false,
}: {
  state?: WorkState;
  paused?: boolean;
}) {
  const resting = state === 'rest' || state === 'after';
  const lunch = state.startsWith('lunch');
  return (
    <svg
      className={`workroom ${paused ? 'paused' : ''}`}
      viewBox="0 0 640 510"
      role="img"
      aria-label={
        resting
          ? '水豚在暖暖的房间休息'
          : lunch
            ? '水豚午休吃饭'
            : '水豚在工位陪你上班'
      }
    >
      <defs>
        <linearGradient id="wall" x2="0" y2="1">
          <stop stopColor="#f3e9d7" />
          <stop offset="1" stopColor="#ede0c7" />
        </linearGradient>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor={resting ? '#c2c4db' : '#c7ded7'} />
          <stop offset="1" stopColor="#f7ebd1" />
        </linearGradient>
        <pattern
          id="floor"
          width="70"
          height="46"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 0h70v46H0z" fill="#d8b992" />
          <path d="M0 46h70M70 0v46" stroke="#c8a67c" />
        </pattern>
      </defs>
      <rect x="12" y="12" width="616" height="486" rx="36" fill="url(#wall)" />
      <path d="M12 354h616v108q0 36-36 36H48q-36 0-36-36z" fill="url(#floor)" />
      <path d="M12 354h616" stroke="#bba886" strokeWidth="5" />
      <rect x="378" y="54" width="176" height="205" rx="82" fill="#bea27c" />
      <rect x="387" y="63" width="158" height="187" rx="74" fill="url(#sky)" />
      <circle cx="475" cy="109" r="24" fill="#fff1b4" />
      <path d="M394 217q30-60 61-16q40-63 83-20v61H394z" fill="#a9bc9e" />
      <path d="M466 62v188M386 167h160" stroke="#bea27c" strokeWidth="8" />
      <path
        d="M365 42v225M568 42v225"
        stroke="#d4b88b"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <rect x="68" y="89" width="110" height="13" rx="4" fill="#bb9367" />
      <path
        d="M85 88V50h15v38M108 88V42h15v46M131 88V57h22v31"
        fill="#77977a"
        stroke="#657a5f"
        strokeWidth="2"
      />
      <rect
        x="68"
        y="128"
        width="111"
        height="84"
        rx="6"
        fill="#fff8e9"
        stroke="#bfa98b"
        strokeWidth="3"
      />
      <path
        d="M82 150h82M82 163h57M82 178h72"
        stroke="#c5b59a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="91" cy="139" r="4" fill="#dc997d" />
      <ellipse
        cx="311"
        cy="440"
        rx="151"
        ry="28"
        fill="#b99670"
        opacity=".28"
      />
      <rect
        x="262"
        y="326"
        width="105"
        height="81"
        rx="25"
        fill="#78927b"
        stroke="#59715c"
        strokeWidth="4"
      />
      <path
        d="M284 400v38M345 400v38"
        stroke="#785c47"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <g className="capy-body">
        <ellipse
          cx="298"
          cy="302"
          rx="69"
          ry="74"
          fill="#bf956c"
          stroke="#76583f"
          strokeWidth="4"
        />
        <path
          d="M245 337q50 24 103 0v49q-13 16-28 0l-8-22l-21 1l-11 23q-19 6-28-7z"
          fill="#d4aa7f"
          stroke="#76583f"
          strokeWidth="4"
        />
        <ellipse
          cx="282"
          cy="244"
          rx="73"
          ry="61"
          fill="#d7b188"
          stroke="#76583f"
          strokeWidth="4"
        />
        <ellipse
          cx="232"
          cy="199"
          rx="16"
          ry="20"
          fill="#c49b72"
          stroke="#76583f"
          strokeWidth="4"
        />
        <ellipse
          cx="324"
          cy="197"
          rx="16"
          ry="19"
          fill="#c49b72"
          stroke="#76583f"
          strokeWidth="4"
        />
        <path
          d="M228 200v-5M321 198v-5"
          stroke="#997451"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {resting ? (
          <path
            d="M243 243l16 3M295 246l16-3"
            stroke="#5a4434"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : (
          <g fill="#5a4434">
            <ellipse cx="251" cy="244" rx="4" ry="6" />
            <ellipse cx="303" cy="244" rx="4" ry="6" />
          </g>
        )}
        <ellipse cx="276" cy="260" rx="19" ry="13" fill="#c39b75" />
        <path
          d="M271 255h10M276 255v10"
          stroke="#6e503a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse
          cx="230"
          cy="259"
          rx="10"
          ry="5"
          fill="#d99980"
          opacity=".65"
        />
        <path
          d="M237 303q-16 25 13 28M333 299q20 24-7 34"
          fill="none"
          stroke="#76583f"
          strokeWidth="17"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M176 338h291v17H176z"
        fill="#b28a5e"
        stroke="#785c3c"
        strokeWidth="4"
      />
      <path
        d="M194 356v88M445 356v88"
        stroke="#987249"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {state === 'rest' ? (
        <g>
          <path
            d="M264 313q24-11 45 0q25-11 46 0v25q-22-7-46 0q-24-7-45 0z"
            fill="#f5e8c9"
            stroke="#8d7052"
            strokeWidth="3"
          />
          <path d="M309 314v24" stroke="#8d7052" strokeWidth="2" />
        </g>
      ) : state === 'after' || state === 'before' ? (
        <g>
          <path
            d="M320 327h113v7H320z"
            fill="#90a28b"
            stroke="#536b5b"
            strokeWidth="3"
          />
          <rect
            x="404"
            y="397"
            width="48"
            height="44"
            rx="9"
            fill="#c59370"
            stroke="#8d7052"
            strokeWidth="3"
          />
          <path
            d="M415 398v-10q13-14 26 0v10"
            fill="none"
            stroke="#8d7052"
            strokeWidth="3"
          />
        </g>
      ) : lunch ? (
        <g>
          <path
            d="M278 318h65q-5 26-33 26t-32-26"
            fill="#f6efdb"
            stroke="#785c3c"
            strokeWidth="3"
          />
          <path d="M285 314q20-11 51 0" stroke="#deab70" strokeWidth="5" />
        </g>
      ) : (
        <g>
          <path
            d="M328 266h103l-10 65h-99z"
            fill={resting ? '#b8b5a4' : '#7b9181'}
            stroke="#536b5b"
            strokeWidth="4"
          />
          <path
            d="M312 332h119"
            stroke="#536b5b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M369 292l9 8l-9 8"
            stroke="#c5d8b8"
            strokeWidth="3"
            fill="none"
          />
        </g>
      )}
      <g className="coffee-steam">
        <path
          d="M218 298q-8-10 0-19M228 299q-8-12 0-22"
          stroke="#fff8ea"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M204 307h28v27h-28z"
        fill="#f2dcaf"
        stroke="#8d7052"
        strokeWidth="3"
      />
      <path
        d="M233 311q16 0 9 15h-9"
        fill="none"
        stroke="#8d7052"
        strokeWidth="3"
      />
      <g>
        <path d="M509 395v-89" stroke="#69825d" strokeWidth="5" />
        <path
          d="M509 353q-47-1-36-39q38-2 36 39M510 334q-5-44 33-47q12 36-33 47M509 316q-29-14-18-39q34 4 18 39"
          fill="#849c70"
        />
        <path
          d="M480 375h60l-8 57h-43z"
          fill="#ce9572"
          stroke="#9e7156"
          strokeWidth="3"
        />
      </g>
      <rect x="72" y="420" width="70" height="29" rx="8" fill="#c6bb95" />
      <path d="M90 421q0-28 22-13q23-16 21 14" fill="#c6bb95" />
    </svg>
  );
}
