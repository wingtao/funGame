import type { PartId } from '../domain/game';
import { parts } from '../domain/game';
export function Explorer({
  part,
  scanning = false,
  progress = 0,
}: {
  part: PartId;
  scanning?: boolean;
  progress?: number;
}) {
  const focus = parts[part].position;
  return (
    <svg
      className="explorer"
      viewBox="0 0 420 510"
      role="img"
      aria-label={`卡通队员豆豆，当前探索${parts[part].label}`}
    >
      <defs>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#b7d4cb" />
        </pattern>
        <linearGradient id="scan-glow" x2="0" y2="1">
          <stop stopColor="#6fbaa8" stopOpacity="0" />
          <stop offset="1" stopColor="#6fbaa8" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="404" height="494" rx="28" fill="url(#dots)" />
      <ellipse cx="210" cy="477" rx="98" ry="12" fill="#adcfc5" opacity=".3" />
      <g
        stroke="#55766f"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M156 350v98q7 22 36 13l18-88l18 88q28 9 36-13v-98"
          fill="#b6d1df"
        />
        <path
          d="M152 446l-18 16q-6 17 26 17h29l5-25M227 454l5 25h30q29-1 24-17l-21-16"
          fill="#f6d596"
        />
        <path
          d="M150 225q-39 7-51 46l-15 61q-5 19 15 22q18 4 23-17l18-48M270 225q39 7 51 46l15 61q5 19-15 22q-18 4-23-17l-18-48"
          fill="#f2d3b4"
        />
        <path d="M151 221q59-27 118 0l17 135q-75 30-152 0z" fill="#f6edd9" />
        <path
          d="M161 223v62q49 20 99 0v-62M144 291q66 27 131 0v63q-69 30-138 0z"
          fill="#a8cfc8"
        />
        <rect x="179" y="301" width="63" height="45" rx="15" fill="#d4e7dc" />
        <path d="M197 321h27M210 309v25" stroke="#6d9b8d" strokeWidth="7" />
        <path d="M191 203v25q19 18 39 0v-25" fill="#f2d3b4" />
        <ellipse cx="132" cy="139" rx="19" ry="24" fill="#f2d3b4" />
        <ellipse cx="288" cy="139" rx="19" ry="24" fill="#f2d3b4" />
        <path
          d="M132 114q-3-76 79-77q80 0 77 77v52q-4 62-78 63q-74-1-78-63z"
          fill="#f5d8bc"
        />
        <path
          d="M132 113q-3-74 74-76q82-4 82 76q-24-6-42-36q-30 43-75 31l7-20q-19 24-46 25"
          fill="#96775e"
        />
        <path
          d="M135 95q-4-55 74-57q75 0 77 56l-36-12q-44-19-79 12z"
          fill="#aecfc4"
        />
        <rect x="177" y="38" width="63" height="40" rx="13" fill="#fffaf0" />
        <path d="M200 58h17M209 49v18" stroke="#739d8b" strokeWidth="6" />
        <ellipse cx="176" cy="144" rx="4" ry="6" fill="#52635c" />
        <ellipse cx="244" cy="144" rx="4" ry="6" fill="#52635c" />
        <path d="M197 171q12 16 25 0" fill="#fffaf0" />
        <path d="M206 158h8" stroke="#c6987e" />
        <path d="M156 160h13M252 160h13" stroke="#dfa994" strokeWidth="9" />
      </g>
      <g opacity={part === 'body' ? 0.6 : 1}>
        <circle
          cx={focus[0] * 4.2}
          cy={focus[1] * 5.1}
          r={part === 'body' ? 23 : 35}
          fill="none"
          stroke="#6ba999"
          strokeWidth="2.5"
          strokeDasharray="5 5"
        />
        <circle
          cx={focus[0] * 4.2}
          cy={focus[1] * 5.1}
          r="43"
          fill="#bfe4d5"
          opacity=".16"
        />
      </g>
      {scanning && (
        <g style={{ transform: `translateY(${50 + progress * 410}px)` }}>
          <rect
            x="42"
            y="-75"
            width="336"
            height="75"
            rx="6"
            fill="url(#scan-glow)"
          />
          <path d="M42 0h336" stroke="#4d9f8a" strokeWidth="3" />
          <circle cx="42" r="5" fill="#4d9f8a" />
          <circle cx="378" r="5" fill="#4d9f8a" />
        </g>
      )}
      <path
        d="M40 66V40h26M354 40h26v26M40 442v26h26M354 468h26v-26"
        fill="none"
        stroke="#8cb7aa"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Buddy({
  color,
  celebrate = false,
}: {
  color: string;
  celebrate?: boolean;
}) {
  return (
    <svg
      className={celebrate ? 'buddy celebrate' : 'buddy'}
      viewBox="0 0 240 190"
      role="img"
      aria-label="友善的故事小精灵"
    >
      <ellipse cx="120" cy="165" rx="68" ry="9" fill="#d1dccc" />
      <g stroke="#63736d" strokeWidth="3" strokeLinecap="round">
        <path
          d="M64 126Q24 93 49 77l19 2Q55 34 83 40l15 14q33-33 51-5q35-8 33 30q42 7 15 45q5 38-42 33H85q-35-1-21-31"
          fill={color}
        />
        <path d="M80 125l-20 10M170 125l21 10" />
        <ellipse cx="95" cy="97" rx="4" ry="6" fill="#55615b" />
        <ellipse cx="149" cy="97" rx="4" ry="6" fill="#55615b" />
        <path d="M111 114q12 13 24 0" fill="#fffdf3" />
        <path d="M72 110h13M159 110h13" stroke="#e6aa9e" strokeWidth="7" />
      </g>
      <path
        d="M204 35l3-10l3 10l10 3l-10 3l-3 10l-3-10l-10-3zM31 47l3-9l3 9l9 3l-9 3l-3 9l-3-9l-9-3z"
        fill="#d3b36f"
      />
    </svg>
  );
}
