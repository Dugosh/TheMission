"use client";

import { useState, useTransition } from "react";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { upsertDailyField } from "@/app/actions/daily";
import { DailyLog, WEIGHT_START, WEIGHT_TARGET } from "@/lib/types";
import { addDaysISO } from "@/lib/calc";

type Props = {
  date: string; // currently viewed date
  recentLogs: Partial<DailyLog>[]; // sorted ascending by date
};

const WINDOW_DAYS = 14;

export default function WeightCard({ date, recentLogs }: Props) {
  const initial =
    recentLogs.find((l) => l.date === date)?.weight_lbs ?? null;
  const [val, setVal] = useState<string>(initial != null ? String(initial) : "");
  const [, start] = useTransition();

  function commit() {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    const clean = Number(n.toFixed(1));
    start(async () => {
      await upsertDailyField(date, { weight_lbs: clean });
    });
  }

  // Build sparkline data: last 14 days from `date`, mapping logs to points
  const points = buildPoints(recentLogs, date, WINDOW_DAYS);

  // Compute 7-day rolling average (ending at viewed date)
  const last7 = points.slice(-7).filter((p) => p.weight != null);
  const avg7 =
    last7.length > 0
      ? last7.reduce((a, b) => a + (b.weight as number), 0) / last7.length
      : null;
  const delta = avg7 != null ? avg7 - WEIGHT_START : null;

  return (
    <section className="rounded-3xl border border-zinc-800/80 bg-zinc-950 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Scale size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-sm font-semibold">Weight</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              {WEIGHT_START} → {WEIGHT_TARGET} lbs
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-2xl font-bold tabular-nums">
            {avg7 != null ? avg7.toFixed(1) : "—"}
            <span className="text-xs font-normal text-zinc-500">7d avg</span>
          </div>
          {delta != null && (
            <div className="flex items-center justify-end gap-1 text-xs">
              {delta < 0 ? (
                <TrendingDown size={12} className="text-emerald-400" />
              ) : delta > 0 ? (
                <TrendingUp size={12} className="text-red-400" />
              ) : (
                <Minus size={12} className="text-zinc-500" />
              )}
              <span
                className={
                  delta < 0
                    ? "text-emerald-400"
                    : delta > 0
                    ? "text-red-400"
                    : "text-zinc-500"
                }
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} lbs from start
              </span>
            </div>
          )}
        </div>
      </div>

      <Sparkline points={points} />

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        <span className="pl-3 text-xs text-zinc-500">Today</span>
        <input
          type="number"
          step={0.1}
          inputMode="decimal"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="—"
          className="flex-1 bg-transparent px-3 py-2 text-right text-base tabular-nums focus:outline-none"
        />
        <span className="pr-3 text-xs text-zinc-500">lbs</span>
      </div>
    </section>
  );
}

type Pt = { date: string; weight: number | null };

function buildPoints(
  logs: Partial<DailyLog>[],
  endDate: string,
  windowDays: number
): Pt[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    if (l.date && l.weight_lbs != null) {
      map.set(l.date, Number(l.weight_lbs));
    }
  }
  const result: Pt[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = addDaysISO(endDate, -i);
    result.push({ date: d, weight: map.get(d) ?? null });
  }
  return result;
}

function Sparkline({ points }: { points: Pt[] }) {
  const W = 320;
  const H = 80;
  const PAD = 6;
  const valued = points.filter((p) => p.weight != null);
  if (valued.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-600">
        Need at least 2 weigh-ins to chart
      </div>
    );
  }
  const weights = valued.map((p) => p.weight as number);
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  const range = Math.max(0.1, max - min);

  const xStep = (W - PAD * 2) / (points.length - 1);
  const yFor = (w: number) => H - PAD - ((w - min) / range) * (H - PAD * 2);

  // Build path through valued points (skip nulls)
  let pathD = "";
  let started = false;
  points.forEach((p, i) => {
    if (p.weight == null) return;
    const x = PAD + i * xStep;
    const y = yFor(p.weight);
    pathD += (started ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    started = true;
  });

  // Area path: down to bottom and close
  const lastValuedIndex = (() => {
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].weight != null) return i;
    }
    return -1;
  })();
  const firstValuedIndex = points.findIndex((p) => p.weight != null);
  const areaD =
    pathD +
    " L" +
    (PAD + lastValuedIndex * xStep).toFixed(1) +
    " " +
    (H - PAD).toFixed(1) +
    " L" +
    (PAD + firstValuedIndex * xStep).toFixed(1) +
    " " +
    (H - PAD).toFixed(1) +
    " Z";

  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900/50 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkfill)" />
        <path
          d={pathD}
          fill="none"
          stroke="rgb(52,211,153)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Last point dot */}
        {(() => {
          const last = [...points].reverse().find((p) => p.weight != null);
          if (!last) return null;
          const idx = points.findIndex((p) => p.date === last.date);
          const x = PAD + idx * xStep;
          const y = yFor(last.weight as number);
          return (
            <circle
              cx={x}
              cy={y}
              r="3"
              fill="rgb(52,211,153)"
              stroke="rgb(9,9,11)"
              strokeWidth="2"
            />
          );
        })()}
      </svg>
    </div>
  );
}
