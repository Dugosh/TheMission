"use client";

type Pt = { x: number; y: number };

type Props = {
  points: Pt[];
  width?: number;
  height?: number;
  color?: string; // tailwind-friendly rgb tuple e.g. "16,185,129"
};

export default function Sparkline({
  points,
  width = 320,
  height = 80,
  color = "16,185,129",
}: Props) {
  if (points.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-600">
        Need at least 2 data points
      </div>
    );
  }
  const PAD = 6;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const rangeY = Math.max(0.1, maxY - minY);
  const rangeX = Math.max(1, maxX - minX);
  const xFor = (x: number) => PAD + ((x - minX) / rangeX) * (width - PAD * 2);
  const yFor = (y: number) =>
    height - PAD - ((y - minY) / rangeY) * (height - PAD * 2);

  let pathD = "";
  points.forEach((p, i) => {
    const x = xFor(p.x);
    const y = yFor(p.y);
    pathD += (i === 0 ? "M" : " L") + x.toFixed(1) + " " + y.toFixed(1);
  });

  const lastX = xFor(points[points.length - 1].x);
  const firstX = xFor(points[0].x);
  const areaD =
    pathD +
    " L" + lastX.toFixed(1) + " " + (height - PAD).toFixed(1) +
    " L" + firstX.toFixed(1) + " " + (height - PAD).toFixed(1) +
    " Z";

  const last = points[points.length - 1];
  const lastPx = { x: xFor(last.x), y: yFor(last.y) };

  const gradId = `sparkfill-${color.replace(/[^0-9]/g, "")}`;

  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900/50 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgb(${color})`} stopOpacity="0.35" />
            <stop offset="100%" stopColor={`rgb(${color})`} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={`rgb(${color})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={lastPx.x}
          cy={lastPx.y}
          r="3"
          fill={`rgb(${color})`}
          stroke="rgb(9,9,11)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
