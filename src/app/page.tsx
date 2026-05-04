import DailyLogForm from "@/components/DailyLogForm";
import StreakCard from "@/components/StreakCard";
import ProgressBar from "@/components/ProgressBar";
import { getDailyLog, getRecentLogs } from "@/app/actions/daily";
import {
  listOpenTodos,
} from "@/app/actions/todos";
import {
  listRevenue,
  listDebtPayments,
  getLatestSavings,
} from "@/app/actions/goals";
import {
  todayISO,
  isAllClean,
  workoutDone,
  streak,
  rollingAverageWeight,
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
  DEBT_INITIAL,
  SAVINGS_TARGET,
} from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Today() {
  const today = todayISO();
  const [todayLog, recent, todos, revenue, debts, savings] = await Promise.all([
    getDailyLog(today),
    getRecentLogs(180),
    listOpenTodos(),
    listRevenue(),
    listDebtPayments(),
    getLatestSavings(),
  ]);

  // Build map for streak calc
  const map = new Map<string, Partial<DailyLog>>();
  for (const r of recent) if (r.date) map.set(r.date, r);

  const cleanStreak = streak(map, today, isAllClean);
  const workoutStreak = streak(map, today, workoutDone);
  const subStreaks = SUBTRACTIONS.map((s) => ({
    label: shortLabel(s.label),
    count: streak(map, today, (l) => l[s.key] === true),
  }));

  // Goal progress
  const avg7 = rollingAverageWeight(recent, today, 7);
  const lbsLost =
    avg7 != null ? Math.max(0, WEIGHT_START - avg7) : null;
  const lbsToGoal =
    avg7 != null ? Math.max(0, avg7 - WEIGHT_TARGET) : null;

  const ytdRevenue = revenue
    .filter((r) => r.month.startsWith(`${REVENUE_YEAR}-`))
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const revenuePct = pct(ytdRevenue, REVENUE_MIN);

  const debtPaid = debts.reduce((s, d) => s + Number(d.amount), 0);
  const debtTotal =
    DEBT_INITIAL.credit_card + DEBT_INITIAL.irs + DEBT_INITIAL.student_loan;
  const debtRemaining = Math.max(0, debtTotal - debtPaid);
  const debtPct = pct(debtPaid, debtTotal);

  const savingsBalance = savings ? Number(savings.balance) : 0;
  const savingsPct = pct(savingsBalance, SAVINGS_TARGET);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-12">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            Today
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {formatLong(today)}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            Clean streak
          </div>
          <div
            className={
              "text-4xl font-bold tabular-nums " +
              (cleanStreak > 0 ? "text-emerald-400" : "text-zinc-600")
            }
          >
            {cleanStreak}
          </div>
        </div>
      </header>

      <DailyLogForm date={today} initial={todayLog ?? {}} />

      {/* Streaks */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold uppercase tracking-wider">
          Streaks
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <StreakCard
            label="Clean (all)"
            count={cleanStreak}
            accent="green"
          />
          <StreakCard label="Workout" count={workoutStreak} accent="green" />
          {subStreaks.map((s) => (
            <StreakCard key={s.label} label={s.label} count={s.count} />
          ))}
        </div>
      </section>

      {/* Goals preview */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider">Goals</h2>
          <Link
            href="/goals"
            className="text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
          >
            Manage →
          </Link>
        </div>
        <div className="space-y-4">
          <GoalRow
            label="Weight"
            primary={
              avg7 != null
                ? `${avg7.toFixed(1)} lbs avg`
                : "no weigh-ins yet"
            }
            secondary={
              avg7 != null && lbsLost != null && lbsToGoal != null
                ? `−${lbsLost.toFixed(1)} lost · ${lbsToGoal.toFixed(
                    1
                  )} to go`
                : `target ${WEIGHT_TARGET} lbs`
            }
            pct={
              avg7 != null
                ? pct(WEIGHT_START - avg7, WEIGHT_START - WEIGHT_TARGET)
                : 0
            }
          />
          <GoalRow
            label="Revenue (Gosian Media)"
            primary={fmtMoney(ytdRevenue)}
            secondary={`${revenuePct.toFixed(1)}% to ${fmtMoney(
              REVENUE_MIN
            )} min`}
            pct={revenuePct}
            tone="blue"
          />
          <GoalRow
            label="Debt eliminated"
            primary={fmtMoney(debtRemaining) + " remaining"}
            secondary={`${debtPct.toFixed(1)}% paid · target ${fmtMoney(
              debtTotal
            )}`}
            pct={debtPct}
            tone="amber"
          />
          <GoalRow
            label="Cash savings"
            primary={fmtMoney(savingsBalance)}
            secondary={`${savingsPct.toFixed(1)}% of ${fmtMoney(
              SAVINGS_TARGET
            )}`}
            pct={savingsPct}
            tone="blue"
          />
        </div>
      </section>

      {/* Open todos preview */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider">
            Open todos
          </h2>
          <Link
            href="/todos"
            className="text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
          >
            Manage →
          </Link>
        </div>
        {todos.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing open. Clean slate.</p>
        ) : (
          <ul className="space-y-1">
            {todos.slice(0, 6).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              >
                <span>
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
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {t.category}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
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
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="tabular-nums text-sm font-semibold">{primary}</span>
      </div>
      <ProgressBar pct={pct} tone={tone} />
      <div className="mt-1 text-xs text-zinc-500">{secondary}</div>
    </div>
  );
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

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
