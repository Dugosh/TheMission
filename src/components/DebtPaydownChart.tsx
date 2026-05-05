/**
 * Cumulative debt-paydown line chart. Shows total $ paid over time
 * vs. the total debt goal. Pure SVG, no library.
 */
import { fmtMoney } from "@/lib/calc";

type Payment = {
  date: string; // YYYY-MM-DD
  amount: number;
};

type Props = {
  payments: Payment[];
  /** Initial total debt — used to draw a target line at top of the chart. */
  totalDebt: number;
};

export default function DebtPaydownChart({ payments, totalDebt }: Props) {
  if (payments.length === 0 || totalDebt <= 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-xs text-zinc-600">
        Log a payment to see paydown over time.
      </p>
    );
  }

  // Sort by date ascending and roll up same-day payments to one point.
  const sorted = [...payments]
    .map((p) => ({ date: p.date, amount: Number(p.amount) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = new Map<string, number>();
  for (const p of sorted) {
    byDate.set(p.date, (byDate.get(p.date) ?? 0) + p.amount);
  }
  const dailySorted = Array.from(byDate.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  // Build cumulative series
  let cum = 0;
  const series = dailySorted.map(([date, amount]) => {
    cum += amount;
    return { date, cum };
  });

  // Prepend an origin point at the first date with cum=0 so the line starts low.
  const firstDate = series[0].date;
  const points = [{ date: firstDate, cum: 0 }, ...series];

  // Geometry
  const w = 560;
  const h = 180;
  const padL = 50;
  const padR = 16;
  const padT = 14;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const xMin = dateToNum(points[0].date);
  const xMax = dateToNum(points[points.length - 1].date);
  // Y range — top of chart is totalDebt so the line approaches the goal
  const yMin = 0;
  const yMax = Math.max(totalDebt, points[points.length - 1].cum);

  const xScale = (d: string) => {
    if (xMax === xMin) return padL + innerW / 2;
    return padL + ((dateToNum(d) - xMin) / (xMax - xMin)) * innerW;
  };
  const yScale = (v: number) =>
    padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.date)} ${yScale(p.cum)}`)
    .join(" ");

  // Fill area under line
  const areaPath =
    `M ${xScale(points[0].date)} ${yScale(0)} ` +
    points
      .map((p) => `L ${xScale(p.date)} ${yScale(p.cum)}`)
      .join(" ") +
    ` L ${xScale(points[points.length - 1].date)} ${yScale(0)} Z`;

  // Y-axis ticks: 4 evenly-spaced
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t);

  // X-axis labels: first, middle, last
  const xTicks = [
    points[0].date,
    points[Math.floor(points.length / 2)].date,
    points[points.length - 1].date,
  ];

  const finalCum = points[points.length - 1].cum;
  const pctOfTotal = totalDebt > 0 ? (finalCum / totalDebt) * 100 : 0;

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        aria-label="Cumulative debt paydown over time"
      >
        <defs>
          <linearGradient id="paydownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(245 158 11)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(245 158 11)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={w - padR}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="rgb(39 39 42)"
              strokeDasharray="2 4"
            />
            <text
              x={padL - 6}
              y={yScale(t) + 3}
              textAnchor="end"
              className="fill-zinc-500 text-[9px] tabular-nums"
            >
              {abbrevMoney(t)}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill="url(#paydownGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="rgb(245 158 11)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Final point */}
        <circle
          cx={xScale(points[points.length - 1].date)}
          cy={yScale(finalCum)}
          r={3.5}
          fill="rgb(245 158 11)"
        />

        {/* X labels */}
        {xTicks.map((d, i) => (
          <text
            key={i}
            x={xScale(d)}
            y={h - 8}
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            className="fill-zinc-500 text-[9px] tabular-nums"
          >
            {fmtShortDate(d)}
          </text>
        ))}
      </svg>

      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-zinc-500 uppercase tracking-wider text-[10px]">
          Cumulative paid
        </span>
        <span className="tabular-nums">
          <span className="font-semibold text-zinc-100">
            {fmtMoney(finalCum)}
          </span>
          <span className="ml-2 text-amber-400">
            {pctOfTotal.toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
}

function dateToNum(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fmtShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${String(y).slice(-2)}`;
}

function abbrevMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}
