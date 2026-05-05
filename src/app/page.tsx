import Link from "next/link";
import Hero from "@/components/today/Hero";
import WeightCard from "@/components/today/WeightCard";
import TileGrid from "@/components/today/TileGrid";
import StreakCard from "@/components/StreakCard";
import ProgressBar from "@/components/ProgressBar";
import { getDailyLog, getRecentLogs } from "@/app/actions/daily";
import { listOpenTodos } from "@/app/actions/todos";
import {
  listRevenue,
  listDebts,
  listDebtPayments,
  getWealthTotals,
} from "@/app/actions/goals";
import {
  todayISO,
  isAllClean,
  workoutDone,
  streak,
  fmtMoney,
  pct,
} from "@/lib/calc";
import {
  DailyLog,
  SUBTRACTIONS,
  WEIGHT_START,
  WEIGHT_TARGET,
  REVENUE_MIN,
  REVENUE_YEAR,
  WEALTH_TARGET,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveDate(rawD: string | string[] | undefined, today: string): string {
  const raw = Array.isArray(rawD) ? rawD[0] : rawD;
  if (!raw || !ISO_RE.test(raw)) return today;
  if (raw > today) return today;
  return raw;
}

export default async function Today({
  searchParams,
}: {
  searchParams: Promise<{ d?: string | string[] }>;
}) {
  const sp = await searchParams;
  const today = todayISO();
  const date = resolveDate(sp.d, today);

  const [dayLog, recent, todos, revenue, debts, debtPayments, wealthTotals] =
    await Promise.all([
      getDailyLog(date),
      getRecentLogs(180),
      listOpenTodos(),
      listRevenue(),
      listDebts(),
      listDebtPayments(),
      getWealthTotals(),
    ]);

  const map = new Map<string, Partial<DailyLog>>();
  for (const r of recent) if (r.date) map.set(r.date, r);

  const cleanStreak = streak(map, today, isAllClean);
  const workoutStreak = streak(map, today, workoutDone);
  const subStreaks = SUBTRACTIONS.map((s) => ({
    label: shortLabel(s.label),
    count: streak(map, today, (l) => l[s.key] === true),
  }));

  const view = dayLog ?? {};
  const cleanCountToday = SUBTRACTIONS.reduce(
    (n, s) => n + (view[s.key] ? 1 : 0),
    0
  );
  const workoutDoneView = workoutDone(view);
  const targets = computeTargets(view);

  const ytdRevenue = revenue
    .filter((r) => r.month.startsWith(`${REVENUE_YEAR}-`))
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const revenuePct = pct(ytdRevenue, REVENUE_MIN);

  const debtTotal = debts.reduce((s, d) => s + Number(d.initial_balance), 0);
  // Only count payments to active debts (mirror Goals page logic).
  const activeDebtIds = new Set(debts.map((d) => d.id));
  const debtPaid = debtPayments.reduce(
    (s, p) =>
      p.debt_id && activeDebtIds.has(p.debt_id) ? s + Number(p.amount) : s,
    0
  );
  const debtRemaining = Math.max(0, debtTotal - debtPaid);
  const debtPct = pct(debtPaid, debtTotal);

  const cashBalance = wealthTotals.cashTotal;
  const investedBalance = wealthTotals.investedTotal;
  const wealthBalance = cashBalance + investedBalance;
  const wealthPct = pct(wealthBalance, WEALTH_TARGET);

  const recentWeights = recent
    .filter((l) => l.weight_lbs != null)
    .slice(0, 7)
    .map((l) => Number(l.weight_lbs));
  const avg7 =
    recentWeights.length > 0
      ? recentWeights.reduce((a, b) => a + b, 0) / recentWeights.length
      : null;

  const recentAsc = recent
    .slice()
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-16 pb-10 lg:px-8 lg:pt-8">
      {/* Top row — Hero spans 2/3, Weight 1/3 on desktop */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Hero
            date={date}
            todayDate={today}
            cleanStreak={cleanStreak}
            cleanCountToday={cleanCountToday}
            workoutDoneToday={workoutDoneView}
            targetsHitToday={targets.hit}
            targetsTotal={targets.total}
          />
        </div>
        <div>
          <WeightCard key={date} date={date} recentLogs={recentAsc} />
        </div>
      </div>

      {/* Tile grid — wider columns on desktop */}
      <div className="mt-6">
        <TileGrid key={date} date={date} initial={view} />
      </div>

      {/* Bottom row — Streaks, Goals preview, Todos preview */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Streaks */}
        <section className="lg:col-span-1">
          <h2 className="mb-3 px-0.5 text-sm font-bold uppercase tracking-widest text-zinc-300">
            Streaks
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StreakCard
              label="Clean (all)"
              count={cleanStreak}
              accent="green"
            />
            <StreakCard
              label="Workout"
              count={workoutStreak}
              accent="green"
            />
            {subStreaks.map((s) => (
              <StreakCard key={s.label} label={s.label} count={s.count} />
            ))}
          </div>
        </section>

        {/* Goals preview */}
        <section className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
              Goals
            </h2>
            <Link
              href="/goals"
              className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
            >
              Manage →
            </Link>
          </div>
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <GoalRow
              label="Weight"
              primary={avg7 != null ? `${avg7.toFixed(1)} lbs` : "no weigh-ins"}
              secondary={
                avg7 != null
                  ? `${(WEIGHT_START - avg7).toFixed(1)} lost · ${Math.max(0, avg7 - WEIGHT_TARGET).toFixed(1)} to go`
                  : `target ${WEIGHT_TARGET} lbs`
              }
              pct={avg7 != null ? pct(WEIGHT_START - avg7, WEIGHT_START - WEIGHT_TARGET) : 0}
            />
            <GoalRow
              label="Sales"
              primary={fmtMoney(ytdRevenue)}
              secondary={`${revenuePct.toFixed(1)}% to ${fmtMoney(REVENUE_MIN)}`}
              pct={revenuePct}
              tone="blue"
            />
            <GoalRow
              label="Debt"
              primary={`${fmtMoney(debtRemaining)} left`}
              secondary={
                debtTotal > 0
                  ? `${debtPct.toFixed(1)}% paid of ${fmtMoney(debtTotal)}`
                  : "No debts tracked"
              }
              pct={debtPct}
              tone="amber"
            />
            <GoalRow
              label="Cash + Invested"
              primary={fmtMoney(wealthBalance)}
              secondary={`${wealthPct.toFixed(1)}% of ${fmtMoney(WEALTH_TARGET)}`}
              pct={wealthPct}
              tone="blue"
            />
          </div>
        </section>

        {/* Todos preview */}
        <section className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
              Open todos
            </h2>
            <Link
              href="/todos"
              className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
            >
              Manage →
            </Link>
          </div>
          {todos.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-6 text-center text-sm text-zinc-500">
              Nothing open. Clean slate.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {todos.slice(0, 8).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm"
                >
                  <span className="flex-1 truncate">
                    <span
                      className={
                        "mr-2 text-[10px] uppercase tracking-wider " +
                        priorityColor(t.priority)
                      }
                    >
                      {t.priority}
                    </span>
                    {t.title}
                  </span>
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">
                    {t.category}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function GoalRow({
  label,
  primary,
  secondary,
  pct,
  tone = "green",
}: {
  label: string;
  primary: string;
  secondary: string;
  pct: number;
  tone?: "green" | "blue" | "amber";
}) {
  const accent =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "blue"
      ? "bg-sky-500"
      : "bg-amber-500";
  return (
    <div className="relative pl-3">
      <span
        className={"absolute left-0 top-0.5 h-full w-1 rounded-full " + accent}
      />
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="tabular-nums text-sm font-semibold">{primary}</span>
      </div>
      <ProgressBar pct={pct} tone={tone} />
      <div className="mt-1 text-[11px] text-zinc-500">{secondary}</div>
    </div>
  );
}

function computeTargets(view: Partial<DailyLog>): {
  hit: number;
  total: number;
} {
  const checks: boolean[] = [
    !!view.pullups_done,
    (view.steps ?? 0) >= 10000,
    !!view.cardio_type && view.cardio_type !== "rest",
    !!view.lifting_type && view.lifting_type !== "rest",
    !!view.sauna,
    !!view.water_gallon,
    !!view.finished_eating_by_730,
    (view.focused_work_hours ?? 0) >= 6,
  ];
  return {
    hit: checks.filter(Boolean).length,
    total: checks.length,
  };
}

function priorityColor(p: string) {
  if (p === "high") return "text-red-400";
  if (p === "medium") return "text-amber-400";
  return "text-zinc-500";
}

function shortLabel(s: string) {
  return s
    .replace(/^No /, "")
    .replace(" / masturbation", "")
    .replace(" food", "");
}
