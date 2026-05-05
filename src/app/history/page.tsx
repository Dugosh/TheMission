import { getAllLogs } from "@/app/actions/daily";
import {
  todayISO,
  isAllClean,
  workoutDone,
  rollingAverageWeight,
} from "@/lib/calc";
import { DailyLog, SUBTRACTIONS } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const logs = await getAllLogs();
  const today = todayISO();
  const map = new Map<string, Partial<DailyLog>>();
  for (const l of logs) if (l.date) map.set(l.date, l);

  // Build grid of last 26 weeks (~6 months) ending this week
  const grid = buildGrid(today, 26);

  // Weekly summary for this week and last week
  const thisWeek = weekSummary(map, today, 0);
  const lastWeek = weekSummary(map, today, 1);
  // Monthly summary current month
  const month = monthSummary(map, today);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-16 pb-10 lg:px-8 lg:pt-8 space-y-10">
      {/* Calendar — top of page, centered */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <a
            href="/api/export"
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs uppercase tracking-wider hover:border-zinc-500"
          >
            Export CSV
          </a>
        </div>
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Compliance calendar
        </h2>
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex min-w-fit justify-center">
            <CalendarGrid grid={grid} map={map} />
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <Legend />
        </div>
      </section>

      {/* Weekly */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Weekly summary
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard title="This week" s={thisWeek} />
          <SummaryCard title="Last week" s={lastWeek} />
        </div>
      </section>

      {/* Monthly */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          This month
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1.5 text-sm">
          <Row k="Days logged" v={String(month.daysLogged)} />
          <Row k="Avg weight" v={month.avgWeight != null ? `${month.avgWeight.toFixed(1)} lbs` : "—"} />
          <Row k="Weight change (1st → today avg)" v={month.weightDelta != null ? `${month.weightDelta > 0 ? "+" : ""}${month.weightDelta.toFixed(1)} lbs` : "—"} />
          <Row k="Avg steps" v={month.avgSteps.toLocaleString()} />
          <Row k="Avg work hours" v={month.avgWorkHours.toFixed(1)} />
          <Row k="Sauna sessions" v={String(month.saunaCount)} />
          <Row k="Workouts" v={String(month.workoutCount)} />
          <Row k="Days fully clean" v={String(month.cleanCount)} />
        </div>
      </section>

      {/* Recent logs list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Recent days
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-zinc-500">No logs yet.</p>
        ) : (
          <ul className="space-y-1">
            {logs
              .slice()
              .reverse()
              .slice(0, 30)
              .map((l) => (
                <li
                  key={l.date}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                >
                  <span className="tabular-nums">{l.date}</span>
                  <span className="text-xs text-zinc-500 flex gap-3">
                    <span>{isAllClean(l) ? "✓ clean" : "✗ broke"}</span>
                    <span>{workoutDone(l) ? "lifted" : "rest"}</span>
                    {l.weight_lbs != null && (
                      <span className="tabular-nums">
                        {Number(l.weight_lbs).toFixed(1)} lbs
                      </span>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-zinc-600">
        Want to backfill or correct a day? Use{" "}
        <Link href="/" className="underline">
          Today
        </Link>{" "}
        with the day picker arrows.
      </p>
    </div>
  );
}

type Cell = { date: string; future: boolean };

function buildGrid(todayIso: string, weeks: number): Cell[][] {
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  const dayOfWeek = todayDate.getDay();
  const endSat = new Date(todayDate);
  endSat.setDate(todayDate.getDate() + (6 - dayOfWeek));

  const cols: Cell[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(endSat);
      cellDate.setDate(endSat.getDate() - w * 7 - (6 - d));
      const iso = isoOf(cellDate);
      col.push({ date: iso, future: cellDate > todayDate });
    }
    cols.push(col);
  }
  return cols;
}

function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function CalendarGrid({
  grid,
  map,
}: {
  grid: Cell[][];
  map: Map<string, Partial<DailyLog>>;
}) {
  return (
    <div className="flex gap-[5px]">
      {grid.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[5px]">
          {col.map((c) => {
            const log = map.get(c.date);
            const cls = cellClass(c, log);
            return (
              <div
                key={c.date}
                title={`${c.date}${log ? ` · ${cellTitle(log)}` : ""}`}
                className={"h-5 w-5 rounded " + cls}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function cellClass(c: Cell, log: Partial<DailyLog> | undefined): string {
  if (c.future) return "bg-zinc-900/40";
  if (!log) return "bg-zinc-900";
  let count = 0;
  for (const s of SUBTRACTIONS) if (log[s.key]) count++;
  if (count === 5) return "bg-emerald-500";
  if (count === 4) return "bg-emerald-700";
  if (count === 3) return "bg-emerald-900";
  if (count === 2) return "bg-amber-700";
  if (count === 1) return "bg-red-700";
  return "bg-red-500";
}

function cellTitle(log: Partial<DailyLog>): string {
  let count = 0;
  for (const s of SUBTRACTIONS) if (log[s.key]) count++;
  return `${count}/5 clean${log.weight_lbs != null ? ` · ${log.weight_lbs} lbs` : ""}`;
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
      <span>0/5</span>
      <div className="h-3 w-3 rounded bg-red-500" />
      <div className="h-3 w-3 rounded bg-red-700" />
      <div className="h-3 w-3 rounded bg-amber-700" />
      <div className="h-3 w-3 rounded bg-emerald-900" />
      <div className="h-3 w-3 rounded bg-emerald-700" />
      <div className="h-3 w-3 rounded bg-emerald-500" />
      <span>5/5</span>
      <div className="h-3 w-3 rounded bg-zinc-900 ml-2" />
      <span>not logged</span>
    </div>
  );
}

function weekSummary(
  map: Map<string, Partial<DailyLog>>,
  todayIso: string,
  weeksBack: number
) {
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  const dayOfWeek = todayDate.getDay();
  const sunday = new Date(todayDate);
  sunday.setDate(todayDate.getDate() - dayOfWeek - weeksBack * 7);

  let trained = 0;
  let saunas = 0;
  let stepsTotal = 0;
  let stepsCount = 0;
  let workTotal = 0;
  let workCount = 0;
  const weights: number[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const log = map.get(isoOf(d));
    if (!log) continue;
    if (workoutDone(log)) trained++;
    if (log.sauna) saunas++;
    if (typeof log.steps === "number" && log.steps > 0) {
      stepsTotal += log.steps;
      stepsCount++;
    }
    if (typeof log.focused_work_hours === "number") {
      workTotal += Number(log.focused_work_hours);
      workCount++;
    }
    if (typeof log.weight_lbs === "number" && log.weight_lbs != null) {
      weights.push(Number(log.weight_lbs));
    }
  }

  const weightChange =
    weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;

  return {
    trained,
    saunas,
    avgSteps: stepsCount ? Math.round(stepsTotal / stepsCount) : 0,
    avgWork: workCount ? workTotal / workCount : 0,
    weightChange,
  };
}

function monthSummary(map: Map<string, Partial<DailyLog>>, todayIso: string) {
  const [ty, tm] = todayIso.split("-").map(Number);
  const monthStart = `${ty}-${String(tm).padStart(2, "0")}-01`;
  const logs: Partial<DailyLog>[] = [];
  for (const [date, log] of map) {
    if (date >= monthStart && date <= todayIso) logs.push(log);
  }
  let saunaCount = 0;
  let workoutCount = 0;
  let cleanCount = 0;
  let stepsTotal = 0;
  let stepsCount = 0;
  let workTotal = 0;
  let workCount = 0;
  const weights: { date: string; w: number }[] = [];
  for (const l of logs) {
    if (l.sauna) saunaCount++;
    if (workoutDone(l)) workoutCount++;
    if (isAllClean(l)) cleanCount++;
    if (typeof l.steps === "number" && l.steps > 0) {
      stepsTotal += l.steps;
      stepsCount++;
    }
    if (typeof l.focused_work_hours === "number") {
      workTotal += Number(l.focused_work_hours);
      workCount++;
    }
    if (l.weight_lbs != null && l.date) {
      weights.push({ date: l.date, w: Number(l.weight_lbs) });
    }
  }
  weights.sort((a, b) => a.date.localeCompare(b.date));
  const avgWeight =
    weights.length > 0
      ? weights.reduce((s, x) => s + x.w, 0) / weights.length
      : null;
  const weightDelta =
    weights.length >= 2 ? weights[weights.length - 1].w - weights[0].w : null;
  const _ = rollingAverageWeight; // suppress unused
  void _;
  return {
    daysLogged: logs.length,
    saunaCount,
    workoutCount,
    cleanCount,
    avgSteps: stepsCount ? Math.round(stepsTotal / stepsCount) : 0,
    avgWorkHours: workCount ? workTotal / workCount : 0,
    avgWeight,
    weightDelta,
  };
}

function SummaryCard({
  title,
  s,
}: {
  title: string;
  s: ReturnType<typeof weekSummary>;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1 text-sm">
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      <Row k="Workouts" v={`${s.trained}/7`} />
      <Row k="Sauna" v={`${s.saunas}/6`} />
      <Row k="Avg steps" v={s.avgSteps.toLocaleString()} />
      <Row k="Avg work" v={`${s.avgWork.toFixed(1)} hrs`} />
      <Row
        k="Weight Δ"
        v={
          s.weightChange != null
            ? `${s.weightChange > 0 ? "+" : ""}${s.weightChange.toFixed(1)} lbs`
            : "—"
        }
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-zinc-400">{k}</span>
      <span className="tabular-nums text-sm">{v}</span>
    </div>
  );
}
