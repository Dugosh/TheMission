/**
 * Donut chart showing remaining debt distribution by category.
 * Pure SVG so we don't pull in a chart library.
 */
import { fmtMoney } from "@/lib/calc";

type Slice = {
  label: string;
  value: number; // remaining $ for this category
  color: string; // tailwind text-color e.g. "text-amber-400"
  hex: string; // hex used for SVG fill
};

type Props = {
  slices: Slice[];
};

export default function DebtPieChart({ slices }: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-xs text-zinc-600">
        Nothing to chart yet — debt is fully paid or empty.
      </p>
    );
  }

  // Donut geometry
  const size = 180;
  const r = 72;
  const strokeWidth = 28;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Compute slice arcs as offsets along the circle
  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const fraction = s.value / total;
      const length = fraction * circumference;
      const arc = {
        ...s,
        fraction,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset,
      };
      offset += length;
      return arc;
    });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-44 w-44 shrink-0 -rotate-90"
        aria-label="Remaining debt by category"
      >
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(24 24 27)"
          strokeWidth={strokeWidth}
        />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={a.hex}
            strokeWidth={strokeWidth}
            strokeDasharray={a.dashArray}
            strokeDashoffset={a.dashOffset}
            strokeLinecap="butt"
          />
        ))}
        {/* center label */}
        <g transform={`rotate(90 ${cx} ${cy})`}>
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-zinc-500 text-[9px] uppercase tracking-wider"
          >
            Remaining
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            className="fill-zinc-100 text-[14px] font-bold tabular-nums"
          >
            {fmtMoney(total)}
          </text>
        </g>
      </svg>

      <ul className="flex-1 space-y-1.5 text-xs">
        {arcs.map((a) => (
          <li
            key={a.label}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: a.hex }}
              />
              <span className="text-zinc-300 truncate">{a.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums text-zinc-400">
              <span>{fmtMoney(a.value)}</span>
              <span className="w-9 text-right text-zinc-500">
                {(a.fraction * 100).toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
