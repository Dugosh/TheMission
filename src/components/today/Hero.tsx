"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Activity, Sparkles } from "lucide-react";
import { addDaysISO } from "@/lib/calc";
import { SUBTRACTIONS } from "@/lib/types";

type Props = {
  date: string;
  todayDate: string;
  cleanStreak: number;
  cleanCountToday: number;
  workoutDoneToday: boolean;
  targetsHitToday: number;
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

  const cleanTotal = SUBTRACTIONS.length;
  const allClean = cleanCountToday === cleanTotal;
  const allTargets = targetsHitToday >= targetsTotal && workoutDoneToday;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl shadow-black/50">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-orange-500/[0.07] blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              {greeting}
            </div>
            <div className="text-2xl font-bold tracking-tight">Evan</div>
          </div>
          {!isToday && (
            <Link
              href="/"
              className="rounded-full border border-emerald-700/60 bg-emerald-950/40 px-3 py-1 text-xs uppercase tracking-wider text-emerald-300 hover:border-emerald-500"
            >
              Today
            </Link>
          )}
        </div>

        {/* Day picker */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 backdrop-blur">
          <Link
            href={dateHref(prevDate, todayDate)}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="text-sm font-semibold tracking-tight">{longDate}</div>
          {canGoForward ? (
            <Link
              href={dateHref(nextDate, todayDate)}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
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

        {/* Big streak hero */}
        <div className="mb-4 rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                Clean streak
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={
                    "text-5xl font-black tabular-nums leading-none " +
                    (cleanStreak > 0
                      ? "text-emerald-300 [text-shadow:0_0_24px_rgba(52,211,153,0.4)]"
                      : "text-zinc-700")
                  }
                >
                  {cleanStreak}
                </span>
                <span className="text-sm text-zinc-500">
                  day{cleanStreak === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            {cleanStreak > 0 && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 ring-1 ring-orange-500/30">
                <Flame
                  size={28}
                  strokeWidth={1.75}
                  className="text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Compliance row */}
        <div className="grid grid-cols-2 gap-3">
          <ComplianceCard
            icon={<Sparkles size={14} />}
            label="Subtractions"
            value={`${cleanCountToday}/${cleanTotal}`}
            highlight={allClean}
          />
          <ComplianceCard
            icon={<Activity size={14} />}
            label="Targets"
            value={`${targetsHitToday}/${targetsTotal}${workoutDoneToday ? " 💪" : ""}`}
            highlight={allTargets}
          />
        </div>
      </div>
    </section>
  );
}

function ComplianceCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border px-4 py-3 transition " +
        (highlight
          ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
          : "border-zinc-800 bg-zinc-950/60")
      }
    >
      <div
        className={
          "flex items-center gap-1 text-[10px] uppercase tracking-widest " +
          (highlight ? "text-emerald-300" : "text-zinc-500")
        }
      >
        {icon}
        {label}
      </div>
      <div
        className={
          "mt-1 text-2xl font-bold tabular-nums leading-none " +
          (highlight ? "text-emerald-200" : "text-zinc-100")
        }
      >
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
