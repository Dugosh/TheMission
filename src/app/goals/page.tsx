import {
  listRevenue,
  listDebts,
  listDebtPayments,
  getLatestSavings,
  listSavings,
  getGoalsState,
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
  ONLINE_BUSINESS_STAGES,
  EQUITY_STAGES,
} from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import RevenueForm from "./_revenue-form";
import DebtForm from "./_debt-form";
import DebtManager from "./_debt-manager";
import SavingsForm from "./_savings-form";
import StatusForm from "./_status-form";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const today = todayISO();
  const [logs, revenue, debts, payments, savings, savingsList, state] =
    await Promise.all([
      getRecentLogs(180),
      listRevenue(),
      listDebts(),
      listDebtPayments(),
      getLatestSavings(),
      listSavings(),
      getGoalsState(),
    ]);

  // ---- Weight ----
  const avg7 = rollingAverageWeight(logs, today, 7);
  const projection = projectWeightCompletion(
    logs,
    today,
    WEIGHT_START,
    WEIGHT_TARGET
  );

  // ---- Revenue ----
  const yearEntries = revenue.filter((r) =>
    r.month.startsWith(`${REVENUE_YEAR}-`)
  );
  const ytd = yearEntries.reduce((s, r) => s + Number(r.amount), 0);
  const monthsLogged = yearEntries.length || 0;
  const monthlyRunRate = monthsLogged > 0 ? ytd / monthsLogged : 0;
  const projectedYearEnd = monthlyRunRate * 12;

  // ---- Debt ----
  const paidByDebtId: Record<string, number> = {};
  for (const p of payments) {
    if (!p.debt_id) continue;
    paidByDebtId[p.debt_id] = (paidByDebtId[p.debt_id] ?? 0) + Number(p.amount);
  }
  const debtTotal = debts.reduce(
    (s, d) => s + Number(d.initial_balance),
    0
  );
  const debtPaid = Object.values(paidByDebtId).reduce((s, n) => s + n, 0);
  const debtRemaining = Math.max(0, debtTotal - debtPaid);

  // ---- Savings ----
  const savingsBalance = savings ? Number(savings.balance) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-12 space-y-10">
      <h1 className="text-3xl font-bold tracking-tight">Goals</h1>

      {/* Weight */}
      <section>
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
        <Stat label="Projected hit date" value={projection.etaDate ?? "—"} />
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
      </section>

      {/* Revenue */}
      <section>
        <SectionHeader title="Revenue · Gosian Media" tone="blue" />
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
        <Stat label="Monthly run rate" value={fmtMoney(monthlyRunRate)} />
        <Stat label="Projected year-end" value={fmtMoney(projectedYearEnd)} />
        <div className="mt-3 mb-4">
          <ProgressBar pct={pct(ytd, REVENUE_MIN)} tone="blue" />
        </div>
        <RevenueForm year={REVENUE_YEAR} entries={yearEntries} />
      </section>

      {/* Debt */}
      <section>
        <SectionHeader title="Debt elimination" tone="amber" />
        <DebtManager debts={debts} paidByDebtId={paidByDebtId} />
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <Stat label="Total initial" value={fmtMoney(debtTotal)} />
          <Stat label="Total paid" value={fmtMoney(debtPaid)} />
          <Stat label="Total remaining" value={fmtMoney(debtRemaining)} />
          <Stat
            label="% eliminated"
            value={`${pct(debtPaid, debtTotal).toFixed(1)}%`}
          />
          <div className="mt-3">
            <ProgressBar pct={pct(debtPaid, debtTotal)} tone="amber" />
          </div>
        </div>

        <div className="mt-6">
          <DebtForm debts={debts} />
        </div>

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
                    className="flex justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2"
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
      </section>

      {/* Savings */}
      <section>
        <SectionHeader title="Cash savings" tone="blue" />
        <Stat label="Current balance" value={fmtMoney(savingsBalance)} />
        <Stat label="Target" value={fmtMoney(SAVINGS_TARGET)} />
        <Stat
          label="Remaining"
          value={fmtMoney(Math.max(0, SAVINGS_TARGET - savingsBalance))}
        />
        <Stat
          label="% to goal"
          value={`${pct(savingsBalance, SAVINGS_TARGET).toFixed(1)}%`}
        />
        <div className="mt-3 mb-4">
          <ProgressBar
            pct={pct(savingsBalance, SAVINGS_TARGET)}
            tone="blue"
          />
        </div>
        <SavingsForm />
        {savingsList.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {savingsList.slice(0, 6).map((s) => (
              <li
                key={s.id}
                className="flex justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <span className="text-zinc-500 tabular-nums">{s.date}</span>
                <span className="tabular-nums">
                  {fmtMoney(Number(s.balance))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Online business */}
      <section>
        <SectionHeader title="Online business" />
        <StatusForm
          field="online_business"
          stages={ONLINE_BUSINESS_STAGES as unknown as string[]}
          currentStatus={state.online_business_status}
          currentNotes={state.online_business_notes ?? ""}
        />
      </section>

      {/* Equity */}
      <section>
        <SectionHeader title="Gosian Media equity investment" />
        <StatusForm
          field="equity"
          stages={EQUITY_STAGES as unknown as string[]}
          currentStatus={state.equity_status}
          currentNotes={state.equity_notes ?? ""}
        />
      </section>
    </div>
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
