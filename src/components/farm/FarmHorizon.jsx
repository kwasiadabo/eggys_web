// Decorative farm horizon silhouette — hills, fence, a hen and wheat.
// Purely visual; hidden from assistive tech.
export default function FarmHorizon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      {/* far hill */}
      <path
        d="M0 140 C 220 90 420 170 720 120 C 1000 75 1220 150 1440 100 L1440 220 L0 220 Z"
        fill="currentColor"
        opacity="0.35"
      />
      {/* near hill */}
      <path
        d="M0 175 C 260 130 480 190 760 150 C 1040 112 1260 185 1440 150 L1440 220 L0 220 Z"
        fill="currentColor"
        opacity="0.55"
      />

      {/* fence, left */}
      <g opacity="0.9" fill="currentColor">
        <rect x="70" y="150" width="8" height="46" rx="2" />
        <rect x="110" y="150" width="8" height="46" rx="2" />
        <rect x="150" y="150" width="8" height="46" rx="2" />
        <rect x="66" y="158" width="96" height="6" rx="2" />
        <rect x="66" y="176" width="96" height="6" rx="2" />
      </g>

      {/* wheat stalks, right */}
      <g opacity="0.9" fill="currentColor">
        {[1230, 1268, 1306, 1344, 1382].map((x, i) => (
          <g key={x} transform={`rotate(${i % 2 === 0 ? -8 : 8} ${x} 210)`}>
            <rect x={x - 1.5} y="152" width="3" height="58" rx="1.5" />
            {[0, 1, 2, 3, 4].map((row) => {
              const w = 7 - row * 0.9;
              const y = 156 + row * 7;
              return (
                <g key={row}>
                  <ellipse cx={x - w} cy={y} rx={w} ry="3" transform={`rotate(-30 ${x - w} ${y})`} />
                  <ellipse cx={x + w} cy={y} rx={w} ry="3" transform={`rotate(30 ${x + w} ${y})`} />
                </g>
              );
            })}
          </g>
        ))}
      </g>

      {/* hen silhouette, standing in the grass */}
      <g transform="translate(410 158)" fill="currentColor">
        {/* tail feathers */}
        <ellipse cx="27" cy="-12" rx="15" ry="6" transform="rotate(-24 27 -12)" />
        <ellipse cx="32" cy="-21" rx="13" ry="5" transform="rotate(-42 32 -21)" />
        <ellipse cx="34" cy="-30" rx="11" ry="4.5" transform="rotate(-58 34 -30)" />
        {/* body */}
        <ellipse cx="0" cy="0" rx="30" ry="22" />
        {/* head */}
        <circle cx="-27" cy="-15" r="11" />
        {/* comb */}
        <path d="M-33 -25 C -35 -29 -31 -31 -29 -28 C -28 -32 -24 -32 -24 -28 C -22 -31 -18 -29 -20 -25 Z" />
        {/* beak */}
        <path d="M-37 -14 L-48 -11 L-37 -9 Z" />
        {/* legs */}
        <rect x="-9" y="20" width="4" height="15" rx="1.5" />
        <rect x="7" y="20" width="4" height="15" rx="1.5" />
      </g>

      {/* scattered eggs in the grass */}
      <g fill="currentColor" opacity="0.85">
        <ellipse cx="300" cy="198" rx="10" ry="13" />
        <ellipse cx="324" cy="204" rx="8" ry="10.5" />
        <ellipse cx="930" cy="194" rx="9" ry="12" />
      </g>
    </svg>
  );
}
