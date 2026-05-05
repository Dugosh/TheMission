"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { addDaysISO } from "@/lib/calc";

type Props = {
  date: string;
  todayDate: string;
  cleanStreak: number;
  cleanCountToday: number; // 0..5
  workoutDoneToday: boolean;
  targetsHitToday: number; // 0..N
  targetsTotal: number;
};

export default function Hero({
  date,
  todayDate,
  cleanStreak,
  cleanCountToday,
  workoutDoneToday,
  targetsHitToday,
  targetsTotal,
}: Props) {
  const isToday = date === todayDate;
  const greeting = greetingFor(new Date());
  const longDate = formatLong(date);

  const prevDate = addDaysISO(date, -1);
  const nextDate = addDaysISO(date, 1);
  const canGoForward = !isToday;

  return (
    <section className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            {greeting}
          </div>
          <div className="text-xl font-bold tracking-tight">Evan</div>
        </div>
        {!isToday && (
          <Link
            href="/"
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs uppercase tracking-wider text-zinc-300 hover:border-zinc-500"
          >
            Today
          </Link>
        )}
      </div>

      {/* Day picker */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-2 py-2">
        <Link
          href={dateHref(prevDate, todayDate)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="text-sm font-semibold tracking-tight">{longDate}</div>
        {canGoForward ? (
          <Link
            href={dateHref(nextDate, todayDate)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </Link>
        ) : (
          <span className="rounded-lg p-2 text-zinc-700">
            <ChevronRight size={18} />
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Clean streak"
          value={String(cleanStreak)}
          accent={cleanStreak > 0}
          icon={cleanStreak > 0 ? <Flame size={14} className="text-orange-400" /> : null}
        />
        <Stat
          label="Subtractions"
          value={`${cleanCountToday}/5`}
          accent={cleanCountToday === 5}
        />
        <Stat
          label="Targets hit"
          value={`${targetsHitToday}/${targetsTotal}${
            workoutDoneToday ? " ✓" : ""
          }`}
          accent={targetsHitToday >= targetsTotal && workoutDoneToday}
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={
          "mt-1 flex items-center gap-1.5 text-2xl font-bold tabular-nums " +
          (accent ? "text-emerald-400" : "text-zinc-100")
        }
      >
        {icon}
        {value}
      </div>
    </div>
  );
}

function dateHref(date: string, todayDate: string): string {
  return date === todayDate ? "/" : `/?d=${date}`;
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late night";
}

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
