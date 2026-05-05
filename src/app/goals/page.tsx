import {
  listRevenue,
  listDebts,
  listDebtPayments,
  getWealthTotals,
  listContributions,
} from "@/app/actions/goals";
import { getRecentLogs } from "@/app/actions/daily";
import {
  todayISO,
  rollingAverageWeight,
  projectWeightCompletion,
  fmtMoney,
  pct,
} from "@/lib/calc";
import {
  WEIGHT_START,
  WEIGHT_TARGET,
  WEIGHT_DEADLINE,
  REVENUE_MIN,
  REVENUE_STRETCH,
  REVENUE_YEAR,
  SAVINGS_TARGET,
  INVESTED_TARGET,
  WEALTH_TARGET,
} from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import RevenueForm from "./_revenue-form";
import DebtForm from "./_debt-form";
import DebtManager from "./_debt-manager";
import SavingsForm from "./_savings-form";
import ContributionsList from "./_contributions-list";
import DebtPieChart from "@/components/DebtPieChart";
import DebtPaydownChart from "@/components/DebtPaydownChart";
import { DEBT_CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const today = todayISO();
  const [
    logs,
    revenue,
    debts,
    payments,
    wealthTotals,
    contributions,
  ] = await Promise.all([
    getRecentLogs(180),
    listRevenue(),
    listDebts(),
    listDebtPayments(),
    getWealthTotals(),
    listContributions(),
  ]);

  // ---- Weight ----
  const avg7 = rollingAverageWeight(logs, today, 7);
  const projection = projectWeightCompletion(
    logs,
    today,
    WEIGHT_START,
    WEIGHT_TARGET
  );

  // ---- Sales ----
  const yearEntries = revenue.filter((r) =>
    r.month.startsWith(`${REVENUE_YEAR}-`)
  );
  const ytd = yearEntries.reduce((s, r) => s + Number(r.amount), 0);
  const monthsLogged = yearEntries.length || 0;
  const monthlyRunRate = monthsLogged > 0 ? ytd / monthsLogged : 0;
  const projectedYearEnd = monthlyRunRate * 12;

  // ---- Debt ----
  // Only count payments that go to ACTIVE debts. Otherwise archiving a debt
  // with prior payments would inflate debtPaid (still counted) while debtTotal
  // (active only) would drop, pushing % eliminated artificially high.
  const activeDebtIds = new Set(debts.map((d) => d.id));
  const paidByDebtId: Record<string, number> = {};
  for (const p of payments) {
    if (!p.debt_id || !activeDebtIds.has(p.debt_id)) continue;
    paidByDebtId[p.debt_id] = (paidByDebtId[p.debt_id] ?? 0) + Number(p.amount);
  }
  const debtTotal = debts.reduce((s, d) => s + Number(d.initial_balance), 0);
  const debtPaid = Object.values(paidByDebtId).reduce((s, n) => s + n, 0);
  const debtRemaining = Math.max(0, debtTotal - debtPaid);

  // ---- Chart data ----
  // Pie: remaining $ per category, only categories with non-zero remaining
  const CATEGORY_COLORS: Record<string, string> = {
    "Credit Card": "#ef4444", // red
    "Auto Loan": "#3b82f6", // blue
    "Student Loan": "#8b5cf6", // violet
    Tax: "#f59e0b", // amber
    Medical: "#ec4899", // pink
    "Personal Loan": "#14b8a6", // teal
    Other: "#71717a", // zinc
  };
  const remainingByCat: Record<string, number> = {};
  for (const d of debts) {
    const remaining = Math.max(
      0,
      Number(d.initial_balance) - (paidByDebtId[d.id] ?? 0)
    );
    remainingByCat[d.category] =
      (remainingByCat[d.category] ?? 0) + remaining;
  }
  const debtPieSlices = DEBT_CATEGORIES.map((cat) => ({
    label: cat,
    value: remainingByCat[cat] ?? 0,
    color: "",
    hex: CATEGORY_COLORS[cat] ?? "#71717a",
  })).filter((s) => s.value > 0);

  // Line chart: payments to active debts only, with date + amount
  const activePayments = payments
    .filter((p) => p.debt_id && activeDebtIds.has(p.debt_id))
    .map((p) => ({ date: p.date, amount: Number(p.amount) }));

  // ---- Wealth (cash + invested) ----
  const cashBalance = wealthTotals.cashTotal;
  const investedBalance = wealthTotals.investedTotal;
  const wealthBalance = cashBalance + investedBalance;


  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-16 pb-10 lg:px-8 lg:pt-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Goals</h1>

      {/* 2-column grid on desktop, single on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weight */}
        <Card>
          <SectionHeader title="Weight loss" tone="green" />
          <Stat label="Start" value={`${WEIGHT_START} lbs`} />
          <Stat label="Target" value={`${WEIGHT_TARGET} lbs`} />
          <Stat
            label="7-day avg"
            value={avg7 != null ? `${avg7.toFixed(1)} lbs` : "—"}
          />
          <Stat
            label="Lost"
            value={
              avg7 != null ? `${(WEIGHT_START - avg7).toFixed(1)} lbs` : "—"
            }
          />
          <Stat
            label="Remaining"
            value={
              avg7 != null
                ? `${Math.max(0, avg7 - WEIGHT_TARGET).toFixed(1)} lbs`
                : "—"
            }
          />
          <Stat
            label="Trend"
            value={
              projection.dailyRate < 0
                ? `${(projection.dailyRate * 7).toFixed(2)} lbs/wk`
                : projection.dailyRate > 0
                ? "Gaining — recheck plan"
                : "—"
            }
          />
          <Stat
            label="Projected hit date"
            value={projection.etaDate ?? "—"}
          />
          <Stat label="Deadline" value={WEIGHT_DEADLINE} />
          <div className="mt-3">
            <ProgressBar
              pct={
                avg7 != null
                  ? pct(WEIGHT_START - avg7, WEIGHT_START - WEIGHT_TARGET)
                  : 0
              }
              tone="green"
            />
          </div>
        </Card>

        {/* Sales */}
        <Card>
          <SectionHeader title="Sales · Gosian Media" tone="blue" />
          <Stat label="YTD" value={fmtMoney(ytd)} />
          <Stat label="Min target" value={fmtMoney(REVENUE_MIN)} />
          <Stat label="Stretch target" value={fmtMoney(REVENUE_STRETCH)} />
          <Stat
            label="% to min"
            value={`${pct(ytd, REVENUE_MIN).toFixed(1)}%`}
          />
          <Stat
            label="% to stretch"
            value={`${pct(ytd, REVENUE_STRETCH).toFixed(1)}%`}
          />
          <Stat
            label="Monthly run rate"
            value={fmtMoney(monthlyRunRate)}
          />
          <Stat
            label="Projected year-end"
            value={fmtMoney(projectedYearEnd)}
          />
          <div className="mt-3 mb-4">
            <ProgressBar pct={pct(ytd, REVENUE_MIN)} tone="blue" />
          </div>
          <RevenueForm year={REVENUE_YEAR} entries={yearEntries} />
        </Card>

        {/* Wealth — cash + invested (full width, above debt) */}
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader title="Cash + Invested" tone="blue" />

            {/* Hero summary */}
            <div className="mb-6 rounded-xl border border-blue-700/30 bg-gradient-to-br from-blue-950/20 to-zinc-950 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-blue-300/70">
                    Total wealth
                  </div>
                  <div className="mt-1 text-4xl font-bold tabular-nums text-zinc-100">
                    {fmtMoney(wealthBalance)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 tabular-nums">
                    {fmtMoney(cashBalance)} cash + {fmtMoney(investedBalance)} invested
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    % to goal
                  </div>
                  <div className="mt-1 text-4xl font-bold tabular-nums text-blue-400">
                    {pct(wealthBalance, WEALTH_TARGET).toFixed(1)}%
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 tabular-nums">
                    of {fmtMoney(WEALTH_TARGET)}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar
                  pct={pct(wealthBalance, WEALTH_TARGET)}
                  tone="blue"
                />
              </div>
            </div>

            {/* 4-stat breakdown */}
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <BreakdownStat
                label="Cash balance"
                value={fmtMoney(cashBalance)}
                accent="blue"
              />
              <BreakdownStat
                label="Invested balance"
                value={fmtMoney(investedBalance)}
                accent="blue"
              />
              <BreakdownStat
                label="Combined"
                value={fmtMoney(wealthBalance)}
              />
              <BreakdownStat
                label="Remaining"
                value={fmtMoney(Math.max(0, WEALTH_TARGET - wealthBalance))}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Log a contribution
                </h3>
                <SavingsForm />
                <p className="mt-2 text-[11px] text-zinc-500">
                  Each contribution adds to your running totals. Cash target {fmtMoney(SAVINGS_TARGET)},
                  invested target {fmtMoney(INVESTED_TARGET)}.
                </p>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Recent contributions
                </h3>
                <ContributionsList contributions={contributions} />
              </div>
            </div>
          </Card>
        </div>

        {/* Debt — full width */}
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader title="Debt elimination" tone="amber" />

            {/* Hero summary — totals up top so they're seen first */}
            <div className="mb-6 rounded-xl border border-amber-700/30 bg-gradient-to-br from-amber-950/20 to-zinc-950 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-300/70">
                    Total remaining
                  </div>
                  <div className="mt-1 text-4xl font-bold tabular-nums text-zinc-100">
                    {fmtMoney(debtRemaining)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 tabular-nums">
                    {fmtMoney(debtPaid)} paid of {fmtMoney(debtTotal)} initial
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    % eliminated
                  </div>
                  <div className="mt-1 text-4xl font-bold tabular-nums text-amber-400">
                    {pct(debtPaid, debtTotal).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar pct={pct(debtPaid, debtTotal)} tone="amber" />
              </div>
            </div>

            {/* Visualizations — right under the hero so they're seen first */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Remaining by category
                </h3>
                <DebtPieChart slices={debtPieSlices} />
              </div>
              <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Paydown over time
                </h3>
                <DebtPaydownChart
                  payments={activePayments}
                  totalDebt={debtTotal}
                />
              </div>
            </div>

            {/* Breakdown strip — 4 labeled stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <BreakdownStat label="Total initial" value={fmtMoney(debtTotal)} />
              <BreakdownStat label="Total paid" value={fmtMoney(debtPaid)} accent="amber" />
              <BreakdownStat label="Total remaining" value={fmtMoney(debtRemaining)} />
              <BreakdownStat
                label="% eliminated"
                value={`${pct(debtPaid, debtTotal).toFixed(1)}%`}
                accent="amber"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <DebtManager debts={debts} paidByDebtId={paidByDebtId} />
              </div>

              <div>
                <DebtForm debts={debts} />
                {payments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                      Recent payments
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {payments.slice(0, 10).map((p) => {
                        const d = debts.find((x) => x.id === p.debt_id);
                        return (
                          <li
                            key={p.id}
                            className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
                          >
                            <span>
                              <span className="mr-2 text-zinc-500 tabular-nums">
                                {p.date}
                              </span>
                              {d?.name ?? "(archived debt)"}
                            </span>
                            <span className="tabular-nums">
                              {fmtMoney(Number(p.amount))}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/40 to-zinc-950 p-5">
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  tone,
}: {
  title: string;
  tone?: "green" | "blue" | "amber";
}) {
  const dot =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "blue"
      ? "bg-sky-500"
      : tone === "amber"
      ? "bg-amber-500"
      : "bg-zinc-500";
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xl font-bold tracking-tight">
      <span className={"h-2 w-2 rounded-full " + dot} />
      {title}
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-zinc-900 py-1.5">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="tabular-nums text-sm font-medium">{value}</span>
    </div>
  );
}

function BreakdownStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "blue";
}) {
  const valueClass =
    accent === "amber"
      ? "text-amber-400"
      : accent === "blue"
        ? "text-blue-400"
        : "text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

