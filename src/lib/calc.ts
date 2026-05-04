import { DailyLog, SUBTRACTIONS } from "./types";

export function todayISO(): string {
  // Use local date components — habit tracker is one user in EST
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isAllClean(log: Partial<DailyLog>): boolean {
  return SUBTRACTIONS.every((s) => log[s.key] === true);
}

export function workoutDone(log: Partial<DailyLog>): boolean {
  const lift = log.lifting_type;
  const cardio = log.cardio_type;
  return (
    (typeof lift === "string" && lift !== "rest" && lift.length > 0) ||
    (typeof cardio === "string" && cardio !== "rest" && cardio.length > 0)
  );
}

// Streak calculation: walk backwards from `today` through given log map.
// `predicate` returns true if that day "counts" toward streak.
// A missing day ends the streak. Today not yet logged does NOT break the streak;
// the streak counts only consecutive completed days ending at the most recent
// logged day that is <= today.
export function streak(
  logs: Map<string, Partial<DailyLog>>,
  today: string,
  predicate: (log: Partial<DailyLog>) => boolean
): number {
  let count = 0;
  let cursor = today;
  // If today is logged and counts, include it. Otherwise start from yesterday.
  const todayLog = logs.get(today);
  if (!todayLog || !predicate(todayLog)) {
    cursor = addDaysISO(today, -1);
  }
  while (true) {
    const log = logs.get(cursor);
    if (!log || !predicate(log)) break;
    count++;
    cursor = addDaysISO(cursor, -1);
  }
  return count;
}

export function rollingAverageWeight(
  logs: Partial<DailyLog>[],
  endISO: string,
  windowDays = 7
): number | null {
  const start = addDaysISO(endISO, -(windowDays - 1));
  const inWindow = logs.filter(
    (l) =>
      l.date &&
      l.date >= start &&
      l.date <= endISO &&
      typeof l.weight_lbs === "number" &&
      l.weight_lbs !== null
  );
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((a, b) => a + (b.weight_lbs as number), 0);
  return sum / inWindow.length;
}

export function projectWeightCompletion(
  logs: Partial<DailyLog>[],
  todayIso: string,
  startWeight: number,
  targetWeight: number
): { dailyRate: number; etaDays: number | null; etaDate: string | null } {
  // Use simple linear regression on last 14 days of weigh-ins
  const start = addDaysISO(todayIso, -13);
  const pts = logs
    .filter(
      (l) =>
        l.date &&
        l.date >= start &&
        l.date <= todayIso &&
        typeof l.weight_lbs === "number" &&
        l.weight_lbs !== null
    )
    .map((l) => ({
      x: dayIndex(l.date!),
      y: l.weight_lbs as number,
    }));
  if (pts.length < 3) return { dailyRate: 0, etaDays: null, etaDate: null };
  const n = pts.length;
  const sumX = pts.reduce((a, p) => a + p.x, 0);
  const sumY = pts.reduce((a, p) => a + p.y, 0);
  const sumXY = pts.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = pts.reduce((a, p) => a + p.x * p.x, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  const denom = sumX2 - n * meanX * meanX;
  if (denom === 0) return { dailyRate: 0, etaDays: null, etaDate: null };
  const slope = (sumXY - n * meanX * meanY) / denom; // lbs per day
  if (slope >= 0) return { dailyRate: slope, etaDays: null, etaDate: null };
  const intercept = meanY - slope * meanX;
  const todayY = slope * dayIndex(todayIso) + intercept;
  const lbsToGo = todayY - targetWeight;
  if (lbsToGo <= 0) return { dailyRate: slope, etaDays: 0, etaDate: todayIso };
  const days = Math.ceil(lbsToGo / -slope);
  return {
    dailyRate: slope,
    etaDays: days,
    etaDate: addDaysISO(todayIso, days),
  };
}

function dayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.max(0, Math.min(100, (num / den) * 100));
}
